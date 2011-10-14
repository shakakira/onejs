var templating = require('./templating'),
    render = templating.render,
    compose = require('functools').compose,
    map = require('functools').map,
    combiner = require('combiner'),
    path  = require('path'),
    readFile = require('fs').readFile,
    logging = require('./logging');

function build(wd, callback){
  loadPackage(wd, function(error, pkg){
    if(error) return callback(error); 

    var pkgs = flattenPackageTree(pkg),
        treeName = templating.makeVariableName(pkg.name);

    pkgs = pkgs.map(function(el){
      return { 'pkg':el, 'treeName':treeName };
    });
    
    map.async(renderPackage, pkgs, function(error, renderedPkgs){
      if(error) return callback(error); 
      renderWrapper({
        'treeName':treeName,
        'renderedPkgs':renderedPkgs
      }, callback);
    });

  });
}

function collectDeps(pkg, callback){

  var deps = [],
      declaredDepObj = pkg.manifest.dependencies,
      declaredDepList = declaredDepObj && Object.keys(declaredDepObj),
      next;

  if(!declaredDepList || !declaredDepList.length){
    return callback(undefined, deps);
  }

  (function _(i){
    if(i>=declaredDepList.length){
      return callback(undefined,deps);
    }

    next = _.bind(null, i+1);

    var dp = declaredDepList[i],
        path = pkg.workingDir + 'node_modules/' + dp + '/';

    if(pkg.packageDict[dp]){
      return next();
    }

    loadPackage(pkg, path, function(error, subpkg){
      if(error){
        return callback(error);
      }

      deps.push(subpkg);
      next();
    });

  })(0);
}

function collectModules(pkg, callback){
  logging.info('Collect modules for the package "'+pkg.name+'"');

  var dirs = pkg.dirs.map(function(el){ return path.join(pkg.workingDir, el); });

  logging.debug('The directories to search:',dirs.join(', '));

  compose.async(combiner.findFiles,
    combiner.includeDirectories,
    combiner.flatten,
    function(filenames,callback){
      callback(undefined,filenames.filter(filterFilename));
    },
    function(filenames, callback){
      logging.debug('Found '+filenames.length+' file(s) under the package "'+pkg.name+'"');
      var modules = [];

      (function _(i){
        if(i>=filenames.length){
          return callback(undefined, modules);
        }

        var next = _.bind(null, i+1);

        loadModule(filenames[i], function(error, module){
          module.filename = module.filename.replace(pkg.workingDir,'').replace(/^lib\//,'');
          module.id = module.filename.replace(/\.js$/,'');
          if(!error) modules.push(module); 
          next();
        });

      })(0);
    })(dirs,callback);
}

function flattenPackageTree(tree){
  var l = [tree];

  var i = -1;
  while(tree.dependencies && ++i<tree.dependencies.length){
    Array.prototype.push.apply(l, flattenPackageTree(tree.dependencies[i]));
  }

  return l;
}

function filterFilename(filename,callback){
  return /\.js$/.test(filename);
}

var loadModule = (function(){

  var template;

  return function(filename, callback){
    logging.info('Load module "'+filename+'"');
    readFile(filename, function(error, bf){
      if(error) return callback(error);

      var content = bf.toString(),
          name = moduleName(filename);

      callback(undefined, {
        'name':name,
        'filename':filename,
        'path':filename,
        'content':content
      });
    });
  }

})();

function loadPackage(/*parentPackage, wd, callback*/){

  var argsLen = arguments.length,
      parentPackage = argsLen == 3 && arguments[0] || undefined,
      wd = arguments[argsLen-2],
      callback = arguments[argsLen-1];

  logging.info('Loading package "'+wd+'"');

  wd[wd.length-1] != '/' && ( wd = wd+'/' );
  wd = wd.replace(/^\.\//,'');

  var mainModule = undefined,
      mainModulePath = undefined,
      manifestPath = wd + 'package.json',
      manifestSource = undefined, 
      manifest = undefined, 
      dependencies = undefined,
      dirs = undefined,
      modules = undefined,
      modulesDict = {},
      pkg = undefined,
      i = undefined;

  readFile(manifestPath, function(error, bf){
    logging.info('Parsing the manifest at "'+manifestPath+'"');
    if(!error){
      manifestSource = bf.toString(); 
      try {
        manifest = JSON.parse(manifestSource);
      } catch(exc) {
        logging.error('Failed to parse the manifest at "'+manifestPath+'"');
        error = exc;
      }
    }

    if(error){
      return callback(error);
    }

    pkg = {
      'id':templating.id(),
      'dependencies':dependencies,
      'dirs':dirs,
      'main':mainModule,
      'manifest':manifest,
      'manifestPath':manifestPath,
      'manifestSource':manifestSource,
      'modules':modules,
      'modulesDict':modulesDict,
      'name':manifest.name,
      'parent':parentPackage,
      'packageDict':parentPackage && parentPackage.packageDict || {},
      'workingDir':wd
    };

    pkg.packageDict[pkg.name] = pkg;
    pkg.dirs = manifest.hasOwnProperty('directories') ? Object.keys(manifest.directories).map(function(key){ return manifest.directories[key]; }) : [''];

    collectDeps(pkg, function(error, deps){
      if(error){
        return callback(error);
      }

      logging.debug('Found '+deps.length+' dependencies for the package "'+pkg.name+'"');

      pkg.dependencies = deps;

      collectModules(pkg, function(error, modules){
        if(error){
          return callback(error);
        }
        
        logging.debug('Collected '+modules.length+' modules for the package "'+pkg.name+'"');

        pkg.modules = modules; 

        var i = modules.length,
            m;
        while(i-->0){
          m = modules[i];
          modulesDict[m.path] = m;
        }

        if(!error && manifest.main){
          mainModulePath = path.join(wd, manifest.main+'.js');
          pkg.main = pkg.modulesDict[mainModulePath];
        }

        callback(error, pkg); 
      });
    });

  });

}

function moduleName(filename){
  var m = filename.match(/([^\/\.]+)\.js$/);
  return !m ? undefined : m[1];
}

function quite(y){
  logging.level = y ? 3 : 1;
}

function renderLibrary(callback){
  logging.info('Rendering library...');
  render({ 'template':'node/path.js' }, function(error, nodePathSC){
    render({ 'template':'library.js', 'view':{}, 'partials':{ 'node_path':nodePathSC } }, callback);
  });
}

function renderModule(options, callback){
  var view = {
    'treeName':options.treeName,
    'parentId':options.pkg.id,
    'id':options.module.id
  };

  logging.info('Rendering module "'+view.id+'"');

  render({ 'template':'module.js', 'view':view, 'partials':{ 'content':options.module.content } }, callback);
}

function renderPackage(options,callback){

  var view = { 
    'treeName':options.treeName,
    'parentId':!options.pkg.parent && 'undefined' || options.pkg.parent.id, 
    'id':options.pkg.id,
    'main': options.pkg.main && options.pkg.main.id,
    'name':options.pkg.name,
    'wd':options.pkg.workingDir
  };

  logging.info('Rendering package "'+view.name+'"');

  var modules = options.pkg.modules.map(function(el){
    return {
      'treeName':options.treeName,
      'pkg':options.pkg,
      'module':el
    }
  });

  map.async(renderModule, modules, function(error, renderedModules){
    if(error) return callback(error);
    render({ 'template':'package.js', 'view':view, 'partials':{ 'modules':renderedModules.join('\n\n') } }, callback);
  });
}

function renderWrapper(options, callback){
  logging.info('Rendering wrapper...');
  renderLibrary(function(error, librarySC){
    if(error){
      return callback(error);
    }
    render({ 
      'template':'wrapper.js', 
      'view':{ 'name':options.treeName }, 
      'partials':{ 
        'library':librarySC, 
        'packages':options.renderedPkgs.join('\n\n\n\n') 
      } 
    }, callback); 
  });
}

function verbose(y){
  logging.level = y ? 0 : 1; 
}


module.exports = {
  'build':build,
  'collectDeps':collectDeps,
  'collectModules':collectModules,
  'filterFilename':filterFilename,
  'flattenPackageTree':flattenPackageTree,
  'loadModule':loadModule,
  'loadPackage':loadPackage,
  'moduleName':moduleName,
  'quite':quite,
  'renderModule':renderModule,
  'verbose':verbose
}

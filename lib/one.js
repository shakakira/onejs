var templating = require('./templating'),
    render = templating.render,
    functools =  require('functools'),
    compose = functools.compose,
    map = functools.map,
    juxt  = functools.juxt,
    combiner = require('combiner'),
    path  = require('path'),
    readFile = require('fs').readFile,
    logging = require('./logging'),
    fs = require('fs'),
    server = require('./server');

function build(options, callback){
  logging.trace('Building package from "%s"', options.manifestPath);
  logging.info('Given build options: %s', Object.keys(options).join(', '));

  options.id = templating.idGenerator();

  loadPkg(options.manifestPath, undefined, options, function(error, pkg){
    if(error) return callback(error); 

    var pkgs = flattenPkgTree(pkg);
    
    var treeName = options.treeName = templating.makeVariableName(pkg.name);

    pkgs = pkgs.map(function(el){
      return { 'pkg':el, 'treeName':treeName };
    });
    
    map.async(renderPackage, pkgs, function(error, renderedPkgs){
      if(error) return callback(error); 

      options.renderedPkgs = renderedPkgs;
      
      logging.info('All packages has been built successfully.');
      renderWrapper(options, function(error, wrapper){
        callback(error, wrapper, pkg);
      });
    });
  });
}

function collectDeps(pkg, options, callback){

  var deps = [],
      declaredDepObj = pkg.manifest.dependencies,
      declaredDepList = declaredDepObj && Object.keys(declaredDepObj),
      next;

  if(!declaredDepList || !declaredDepList.length){
    return callback(undefined, deps);
  }

  (function _(i){
    if(i>=declaredDepList.length){
      logging.debug('Loaded %d dependencies under the package "%s"',declaredDepList.length, pkg.manifest.name);
      return callback(undefined,deps);
    }

    next = _.bind(null, i+1);

    var dp = declaredDepList[i],
        manifestPath = path.join(pkg.wd, 'node_modules/', dp, '/package.json');

    logging.debug('Loading the dependency in "'+manifestPath+'" for the package "'+pkg.name+'"');

    if(pkg.pkgDict[dp]){
      return next();
    }

    loadPkg(manifestPath, pkg, options, function(error, subpkg){
      if(error){
        return callback(error);
      }

      deps.push(subpkg);
      next();
    });

  })(0);
}

function collectModules(pkg, callback){
  logging.debug('Collect modules for the package "'+pkg.name+'"');

  var dir = path.join(pkg.wd, pkg.dirs.lib || '.');

  logging.debug('The directories to search:',dir);

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
          logging.debug('Loaded %d module(s) under the package "%s"',filenames.length,pkg.name);
          return callback(undefined, modules);
        }

        var next = _.bind(null, i+1);

        loadModule(filenames[i], function(error, module){
          if(error){
            logging.error('Failed to load the module "'+filenames[i]+'"');
            return callback(error);
          }

          module.filename = module.filename.replace(dir+'/', '').replace(dir,'');
          module.id = module.filename.replace(/\.js$/,'');
          if(!error) modules.push(module); 
          next();
        });

      })(0);
    })([dir],callback);
}

function flattenPkgTree(tree){
  var l = [tree];

  var i = -1;
  while(tree.dependencies && ++i<tree.dependencies.length){
    Array.prototype.push.apply(l, flattenPkgTree(tree.dependencies[i]));
  }

  return l;
}

function filterFilename(filename,callback){
  return /\.js$/.test(filename);
}

function loadManifest(path, callback){
  logging.debug('Loading the manifest @ "'+path+'"');

  var manifest,
      manifestSource;
  
  readFile(path, function(error, bf){
    if(error){
      logging.error('Failed to read the file "'+path+'"');
      return callback(error);
    }
    logging.debug('Parsing the manifest @ "'+path+'"');

    if(!error){
      manifestSource = bf.toString(); 
      try {
        manifest = JSON.parse(manifestSource);
        logging.debug('Manifest file "%s" loaded and parsed successfully.', path);
      } catch(exc) {
        logging.error('Failed to parse the manifest @ "'+path+'"');
        error = exc;
      }
    }

    callback(error, manifest);

  });
}

var loadModule = (function(){

  var template;

  return function loadModule(filename, callback){
    logging.debug('Loading module "'+filename+'"');
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
  };

})();

function loadPkg(manifestPath, parentPkg, options, callback){

  var wd = path.normalize(path.dirname(manifestPath));

  logging.debug('Loading the package "%s"', manifestPath);

  loadManifest(manifestPath, function(error, manifest){
    if(error){
      return callback(error);
    }
    
    var pkg = {
      'id':options.id(),
      'dependencies':undefined,
      'dirs':undefined,
      'main':undefined,
      'manifest':manifest,
      'modules':undefined,
      'modulesDict':{},
      'name':manifest.name,
      'parent':parentPkg,
      'pkgDict':parentPkg ? parentPkg.pkgDict : {},
      'wd':wd
    };

    pkg.pkgDict[pkg.name] = pkg;
    pkg.dirs = manifest.directories || { 'lib':'.' };

    collectDeps(pkg, options, function(error, deps){
      if(error){
        logging.error('An unexpected error occurred during collecting dependencies of the package "'+pkg.name+'".');
        return callback(error);
      }

      logging.debug('Found '+deps.length+' dependencies for the package "'+pkg.name+'"');

      pkg.dependencies = deps;

      collectModules(pkg, function(error, modules){
        if(error){
          logging.error('An unexpected error occurred during collecting modules of the package "'+pkg.name+'".');
          return callback(error);
        }
        
        logging.debug('Collected '+modules.length+' modules for the package "'+pkg.name+'"');

        pkg.modules = modules; 

        var i = modules.length, m, mainModulePath;

        while(i-->0){
          m = modules[i];
          pkg.modulesDict[m.path] = m;
        }

        if(manifest.main){
          mainModulePath = path.join(wd, manifest.main+'.js');
          pkg.main = pkg.modulesDict[mainModulePath];
        }

        logging.info('%s loaded.', pkg.name);

        callback(error, pkg); 
      });

    });

  });
}

function moduleName(filename){
  var m = filename.match(/([^\/\.]+)\.js$/);
  return !m ? undefined : m[1];
}

function quiet(y){
  logging.setLevel('ERROR');
}

function renderLibrary(options, callback){
  logging.trace('Rendering library...');


  render({ 'template':'path.js' }, function(error, path){
    if(error) return callback(error);

    render({ 'template':'process.js', view:{ 'node_version':process.version, 'versions':JSON.stringify(process.versions) } }, function(error, processEmu){
      if(error) return callback(error);
      return render({ 'template':'library.js', 'view':{ node:true }, 'partials':{ 'path':path, 'process':processEmu } }, callback);  
    });    
  });

}

function renderModule(options, callback){
  var view = {
    'treeName':options.treeName,
    'parentId':options.pkg.id,
    'id':options.module.id
  };

  logging.debug('Rendering module "'+view.id+'"');

  render({ 'template':'module.js', 'view':view, 'partials':{ 'content':options.module.content } }, callback);
}

function renderPackage(options,callback){

  var view = { 
    'treeName':options.treeName,
    'parentId':!options.pkg.parent && 'undefined' || options.pkg.parent.id, 
    'id':options.pkg.id,
    'main': options.pkg.main && options.pkg.main.id,
    'name':options.pkg.name,
    'wd':options.pkg.wd
  };

  logging.debug('Rendering package "'+view.name+'"');

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
  logging.trace('Rendering wrapper...');
  renderLibrary({ 'node':options.node }, function(error, librarySC){
    if(error){
      return callback(error);
    }
    render({ 
      'template':'wrapper.js', 
      'view':{ 'name':options.treeName }, 
      'partials':{ 
        'node':'',
        'library':librarySC, 
        'packages':options.renderedPkgs.join('\n\n\n\n') 
      } 
    }, callback); 
  });
}

function save(target, content, callback){
  logging.debug('Saving output into '+target);
  fs.writeFile(target, content, function(error) {
    if(error) {
      logging.error('Failed to write the target file "'+target+'"');
      return callback(error);
    }

    logging.info('The target file "'+target+'" was saved!');
    callback();
  }); 
}

function publish(options){
  options.returnPackage = true;
  build(options, function(error, built, pkg){
    if(error) throw error;
    options.content = built;
    options.pkg = pkg;
    server.start(options);
  });
}

function verbose(){
  logging.setLevel('TRACE');
}

function verbosity(level){
  logging.setLevel(level);
}

module.exports = {
  'build':build,
  'collectDeps':collectDeps,
  'collectModules':collectModules,
  'filterFilename':filterFilename,
  'flattenPkgTree':flattenPkgTree,
  'loadManifest':loadManifest,
  'loadModule':loadModule,
  'loadPkg':loadPkg,
  'moduleName':moduleName,
  'quiet':quiet,
  'publish':publish,
  'renderModule':renderModule,
  'save':save,
  'verbose':verbose,
  'verbosity':verbosity
}

var path         = require('path'),
    logging      = require('./logging'),

    fs           = require('fs'),
    idGenerator  = require('./templating').idGenerator,
    readFile     = fs.readFile,

    modules      = require('./modules'),
    dependencies;

function construct(wd, manifest, parentPkg, options){

  !options && ( options = {} );

  var pkg = {
    'id':options.id && options.id() || ( options.id = idGenerator() ),
    'dependencies':undefined,
    'dirs':manifest.directories || {},
    'main':undefined,
    'manifest':manifest,
    'modules':undefined,
    'modulesDict':{},
    'name':manifest.name,
    'parent': parentPkg,
    'pkgDict': parentPkg ? parentPkg.pkgDict : {},
    'wd': wd
  };

  pkg.pkgDict[pkg.name] = pkg;

  return pkg;
}

function loadFromManifestPath(manifestPath, parentPkg, options, callback){
  logging.debug('Loading package from manifest path "%s"', manifestPath);

  manifest(manifestPath, function(error, manifest){

    if(error){
      callback(error);
      return;
    }

    var pkg = construct(path.normalize(path.dirname(manifestPath)), manifest, parentPkg, options);

    load(pkg, options, callback);

  });
}

function manifest(path, callback){
  logging.debug('Loading the manifest @ "'+path+'"');

  var manifest,
      manifestSource;

  readFile(path, function(error, bf){

    if(error){
      logging.error('Failed to read the file "'+path+'"');
      callback(error);
      return;
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

function load(pkg, options, callback){

  logging.debug('Loading the package "%s"', pkg.manifest.name);

  if( dependencies == undefined ) {
    dependencies = require('./dependencies');
  }

  dependencies(pkg, options, function(error, deps){
    if(error){
      logging.error('An unexpected error occurred during collecting dependencies of the package "'+pkg.name+'".');
      logging.error(error);
      callback(error);
      return;
    }


    logging.debug('Found '+deps.length+' dependencies for the package "'+pkg.name+'"');

    pkg.dependencies = deps;

    modules(pkg, function(error, modules){
      if(error){
        logging.error('An unexpected error occurred during collecting modules of the package "'+pkg.name+'".');
        logging.error(error);
        callback(error);
        return;
      }

      logging.debug('Collected '+modules.length+' modules for the package "'+pkg.name+'"');

      pkg.modules = modules;

      var i = modules.length, m, mainModulePath;

      while(i-->0){
        m = modules[i];
        pkg.modulesDict[m.path] = m;
      }

      if(pkg.manifest.main){
        mainModulePath = path.join(pkg.wd, pkg.manifest.main + ( /\.js$/.test(pkg.manifest.main) ? '' : '.js' ));

        pkg.main = pkg.modulesDict[mainModulePath];

        pkg.mainModuleId = pkg.main.name;
      }

      logging.info('%s loaded.', pkg.name);

      callback(error, pkg);
    });

  });
}

module.exports = {
  'construct': construct,
  'load': load,
  'loadFromManifestPath': loadFromManifestPath,
  'manifest': manifest
};

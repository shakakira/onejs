var path        = require('path'),
    readdir     = require('fs').readdir,

    logging     = require('./logging'),

    installDict = Object.keys(require('./install_dict')),

    packages    = require('./packages');

const BLACK_LIST = [
  'one'
];

function nodeCorePackages(pkg, callback){
  readdir( path.join(pkg.wd, 'node_modules'), function(error, files){

    if(error){
      callback([]);
      return;
    }

    callback(files.filter(function(el){

      return installDict.indexOf(el) > -1;

    }));

  });
}

function findManifestPath(name, wd, callback){
  logging.debug('Searching for the manifest of package "%s" under "%s"', name, wd);

  var manifest = path.join(wd, 'node_modules', name, '/package.json');
  path.exists(manifest, function(exists){
    if(exists){
      callback(undefined, manifest);
      return;
    }

    path.exists( path.join(wd, '../'), function(exists){

      if(!exists){
        logging.error('Failed to find package "%s"', name);
        callback(new Error('Failed to find package "'+name+'"'));
        return;
      }

      findManifestPath(name, path.join(wd, '../'), callback);

    });

  });
}

function dependencies(pkg, options, callback){

  var deps           = [],
      declaredDepObj = pkg.manifest.dependencies,
      declaredDepList,
      next;

  if(declaredDepObj){
    declaredDepList = Object.keys(declaredDepObj).filter(function(name){
      return BLACK_LIST.indexOf(name) == -1 && ( !options.exclude || options.exclude.indexOf(name) == -1 );
    });
  }

  nodeCorePackages(pkg, function(installedNodeCorePackages){

    if(installedNodeCorePackages.length){
      !declaredDepList && ( declaredDepList = [] );
      declaredDepList = declaredDepList.concat(installedNodeCorePackages);
    }

    if(!declaredDepList || !declaredDepList.length){
      callback(undefined, deps);
      return;
    }

    (function iter(i){

      if(i>=declaredDepList.length){
        logging.debug('Loaded %d dependencies under the package "%s"',declaredDepList.length, pkg.manifest.name);
        callback(undefined, deps);
        return;
      }

      next = iter.bind(null, i+1);

      var dp = declaredDepList[i];

      findManifestPath(dp, pkg.wd, function(error, manifestPath){

        if(error){
          callback(error);
          return;
        }

        logging.debug('Loading the dependency in "'+manifestPath+'" for the package "'+pkg.name+'"');

        if(pkg.pkgDict[dp]){
          deps.push(pkg.pkgDict[dp]);
          next();
          return;
        }

        packages.loadFromManifestPath(manifestPath, pkg, options, function(error, subpkg){

          if(error){
            logging.warn(error);
            next();
            return;
          }

          deps.push(subpkg);
          next();
        });

      });

    })(0);

  });
};



module.exports = dependencies;

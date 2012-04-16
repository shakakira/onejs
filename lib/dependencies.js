var path        = require('path'),
    readdir     = require('fs').readdir,

    logging     = require('./logging'),

    installDict = Object.keys(require('./install_dict')),

    packages    = require('./packages');

const BLACK_LIST = [
  'one'
];

function nodePackages(pkg, callback){
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

function dependencies(pkg, options, callback){

  var deps           = [],
      declaredDepObj = pkg.manifest.dependencies,
      declaredDepList,
      next;

  if(declaredDepObj){
    declaredDepList = Object.keys(declaredDepObj).filter(function(name){
      return BLACK_LIST.indexOf(name) == -1;
    });
  }

  nodePackages(pkg, function(installedNodePackages){

    if(installedNodePackages.length){
      !declaredDepList && ( declaredDepList = [] );
      declaredDepList = declaredDepList.concat(installedNodePackages);
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

      var dp = declaredDepList[i],
          manifestPath = path.join(pkg.wd, 'node_modules/', dp, '/package.json');

      logging.debug('Loading the dependency in "'+manifestPath+'" for the package "'+pkg.name+'"');

      if(pkg.pkgDict[dp]){
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

    })(0);

  });
};



module.exports = dependencies;

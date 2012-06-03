var path        = require('path'),
    readdir     = require('fs').readdir,
    logging     = require('./logging'),

    installDict = Object.keys(require('./install_dict')),
    pkg;

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

function dependencies(parent, options, callback){

  var deps           = [],
      declaredDepObj = parent.manifest.dependencies,
      declaredDepList,
      next;

  if(declaredDepObj){
    declaredDepList = Object.keys(declaredDepObj).filter(function(name){
      return BLACK_LIST.indexOf(name) == -1 && ( !options.exclude || options.exclude.indexOf(name) == -1 );
    });
  }

  nodeCorePackages(parent, function(installedNodeCorePackages){

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
        logging.debug('Loaded %d dependencies under the package "%s"',declaredDepList.length, parent.manifest.name);
        callback(undefined, deps);
        return;
      }

      next = iter.bind(null, i+1);

      var dp = declaredDepList[i],
          manifestPath = path.join(parent.wd, 'node_modules/', dp, '/package.json');

      logging.debug('Loading the dependency "%s" for its parent package "%s"', dp + ' ('+ manifestPath +')', parent.name);

      if(parent.pkgdict[dp]){
        next();
        return;
      }

      !pkg && ( pkg = require('./package') );
      pkg({ 'manifestPath': manifestPath, 'parent': parent }, options, function(error, dependency){

        if(error){
          logging.warn(error);
          next();
          return;
        }

        deps.push(dependency);
        next();
      });

    })(0);

  });
};



module.exports = dependencies;

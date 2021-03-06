var path        = require('path'),
    readdir     = require('fs').readdir,
    logging     = require('./logging'),
    manifest    = require('./manifest'),
    excludeds   = require('./excludeds'),
    pkg;

const BLACK_LIST = [
  'one'
];

function dependencies(parent, options, callback){
  var deps           = [],
      declaredDepObj = parent.manifest.dependencies,
      exclude        = excludeds(parent, options),
      declaredDepList,
      next;

  if(declaredDepObj){
    declaredDepList = Object.keys(declaredDepObj).filter(function(name){
      return BLACK_LIST.indexOf(name) == -1 && ( exclude.indexOf(name) == -1 );
    });
  }

    if(!declaredDepList || !declaredDepList.length){
      callback(undefined, deps);
      return;
    }

    (function iter(i){

      if(i>=declaredDepList.length){
        logging.debug('Loaded %d dependencies under the package "%s"',deps.length, parent.manifest.name);
        callback(undefined, deps);
        return;
      }

      next = iter.bind(null, i+1);

      var name = declaredDepList[i];

      manifest.find(name, parent.wd, function(error, manifestPath){

        if(error){
          callback(error);
          return;
        }

        logging.debug('Loading the dependency "%s" for its parent package "%s"', name + ' ('+ manifestPath +')', parent.name);

        if(parent.pkgdict[name]){
          parent.pkgdict[name].parents.push(parent);
          deps.push(parent.pkgdict[name]);
          next();
          return;
        }

        !pkg && ( pkg = require('./package') );
        pkg({ 'manifestPath': manifestPath, 'parent': parent }, options, function(error, dependency){

          deps.push(dependency);
          next();

        });

      });

    })(0);
};

module.exports = dependencies;

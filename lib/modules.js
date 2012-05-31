var functools =  require('functools'),
    compose   = functools.compose,
    combiner  = require('combiner'),

    path      = require('path'),
    readFile  = require('fs').readFile,

    logging   = require('./logging');

function filterFilename(filename,callback){
  return /\.js$/.test(filename);
}

var load = (function(){

  var template;

  return function load(filename, callback){
    logging.debug('Loading module "'+filename+'"');
    readFile(filename, function(error, bf){
      if(error) {
        callback(error);
        return;
      }

      var content = bf.toString(),
          name = fixname(filename);

      if(content.substring(0,2) == '#!'){
        content = content.replace(/\#\!.+\n/, '');
      }

      callback(undefined, {
        'name':name,
        'filename':filename,
        'path':filename,
        'content':content
      });
    });
  };

})();

function fixname(filename){
  var m = filename.match(/([^\/\.]+)\.js$/);
  return !m ? undefined : m[1];
}

function modules(pkg, callback){
  logging.debug('Collect modules for the package "'+pkg.name+'"');

  var dirs = [],
      base = '',
      join = path.join.bind(undefined, pkg.wd),
      lib  = join('lib');

  if(pkg.dirs && pkg.dirs.lib){
    base = join(pkg.dirs.lib);
    dirs.push(base);
  } else if (pkg.manifest.main) {
    base = pkg.wd;

    dirs.indexOf(lib) == -1 && dirs.push(lib);
    dirs.push(join(pkg.manifest.main + ( /\.js$/.test(pkg.manifest.main) ? '' : '.js' )));

  } else {
    base = pkg.wd;
    dirs.push(join('index.js'));
    dirs.push(join('lib'));
  }

  logging.debug('The directories to search:',dirs);

  compose.async(combiner.findFiles,
    combiner.includeDirectories,
    combiner.flatten,
    function(filenames,callback){
      callback(undefined,filenames.filter(filterFilename));
    },
    function(filenames, callback){
      logging.debug('Found '+filenames.length+' file(s) under the package "'+pkg.name+'"');
      var modules = [];

      (function next(i){
        if(i>=filenames.length){
          logging.debug('Loaded %d module(s) under the package "%s"',filenames.length,pkg.name);
          callback(undefined, modules);
          return;
        }

        load(filenames[i], function(error, module){
          if(error){
            logging.error('Failed to load the module "'+filenames[i]+'"');
            callback(error);
            return;
          }

          module.filename = module.filename.replace(base+'/', '');
          module.filename.indexOf('/') > 0 && base != '.' && ( module.filename = module.filename.replace(base, '') );
          module.id = module.filename.replace(/\.js$/,'');


          if(!error) modules.push(module);

          next(i+1);

        });

      })(0);
    })(dirs,callback);
}

module.exports = modules;
module.exports.filterFilename = filterFilename;
module.exports.load = load;
module.exports.fixname = fixname;

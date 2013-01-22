var genpkg       = require('genpkg'),
    path         = require('path'),
    fs           = require('fs'),

    id           = require('./id'),
    templating   = require('./templating'),

    logging      = require('./logging'),
    server       = require('./server'),

    manifest     = require('./manifest'),
    dependencies = require('./dependencies'),
    pkg          = require('./package'),
    modules      = require('./modules'),

    npmignore    = require('./npmignore');

var slice = Array.prototype.slice;

function build(manifestPath, buildOptions, callback){

  var pkgOptions = {
    'manifestPath': manifestPath
  };

  readNPMIgnore(pkgOptions, buildOptions, function(error, toIgnore){

    toIgnore && ( pkgOptions.ignore = toIgnore );
    templating(pkgOptions, buildOptions, callback);

  });
}

function readNPMIgnore(pkgOptions, buildOptions, callback){

  if( buildOptions.ignore ){
    callback(undefined, buildOptions.ignore);
    return;
  }

  npmignore(path.dirname(pkgOptions.manifestPath), function(error, toIgnore){

    if(error){
      logging.warn('Failed to read .npmignore');
      callback();
      return;
    }

    callback(undefined, toIgnore);

  });

}

function quiet(y){
  logging.setLevel('ERROR');
}

function save(target, content, callback){
  logging.debug('Saving output into ' + target);

  fs.writeFile(target, content, function(error) {
    if(error) {
      logging.error('Failed to write the target file "'+target+'"');
      callback(error);
      return;
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
  'build': build,
  'dependencies': dependencies,
  'id': id,
  'pkg': pkg,
  'npmignore': npmignore,
  'manifest': manifest,
  'modules': modules,
  'logging': logging,
  'quiet': quiet,
  'publish': publish,
  'save': save,
  'templating': templating,
  'verbose': verbose,
  'verbosity': verbosity
};

var logging   = require('../../logging'),
    library   = require('./library'),
    templates = require('./templates'),
    ties      = require('../../ties');

function renderTies(ties){
   var output = '{',
       key, comma = '';

  for(key in ties){
    output += comma + '"' + key + '": ' + ties[key];
    comma = ', ';
  }

  output += '}';

  return output;
};

function wrapper(pkg, treeName, renderedPackages, options, callback){
  logging.trace('Rendering wrapper template...');

  var partials = {},
      views     = {
        'name'            : treeName,
        'debug'           : options.debug,
        'ties'            : renderTies(ties(pkg, options))
      };

  library(options, function(error, renderedLibrary){

    if(error){
      callback(error);
      return;
    }

    views.packages = renderedPackages;
    views.library  = renderedLibrary;

    templates.wrapper(views, callback);

  });
}

module.exports = wrapper;

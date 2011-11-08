var mustache = require('mustache'),
    fs = require('fs'),
    config = require('./config'),
    errors = require('./errors');

var idGenerator = function(){
  var serial = 0;
  return function id(){
    return ++serial;
  };
};

function makeVariableName(str){
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+/g,' ').replace(/^[\d\s]+/g,'').split(' ').reduce(function(a,b){
    return a + b.charAt(0).toUpperCase() + b.slice(1).toLowerCase();
  });
}

function render(options,callback){
  fs.readFile(config.TEMPLATES_DIR+'/'+options.template, function(error, bf){
    var result;
    if(!error){
      result = mustache.to_html(bf.toString(), options.view, options.partials);
    }
    callback(error, result);
  });
}

module.exports = {
  'id':idGenerator(),
  'idGenerator':idGenerator,
  'makeVariableName':makeVariableName,
  'render':render
}

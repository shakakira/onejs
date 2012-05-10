var readFile   = require('fs').readFile,
    logging    = require('./logging'),
    templating = require('./templating'),
    functools  =  require('functools'),

    map        = functools.map;

function flattenPkgTree(tree){
  var l = [tree];

  var i = -1;
  while(tree.dependencies && ++i<tree.dependencies.length){
    Array.prototype.push.apply(l, flattenPkgTree(tree.dependencies[i]));
  }

  return l;
}

function render(pkg, options, callback){

  var treeName = options.treeName = templating.makeVariableName(pkg.name);
  var pkgs = flattenPkgTree(pkg);

  pkgs = pkgs.map(function(el){
    return { 'pkg':el, 'treeName':treeName };
  });

  map.async(renderPackage, pkgs, function(error, renderedPkgs){
    if(error) {
      callback(error);
      return;
    }

    options.renderedPkgs = renderedPkgs;

    logging.info('All packages has been built successfully.');

    renderWrapper(options, callback);
  });
};

function renderLibrary(options, callback){
  logging.trace('Rendering library...');

  templating.render({ 'template':'path.js' }, function(error, path){
    if(error) {
      callback(error);
      return;
    }

    var env, key;

    if(options.debug){
      env = {};
      for(key in process.env){
        env[ key ] = process.env[ key ].replace(/"/g, '\'');
      }
    }

    var view = {
      'debug': options.debug,
      'version':'1.3.5',
      'versions': '{}',
      'env': options.debug ? JSON.stringify(env, null, 4) : undefined
    };

    templating.render({ 'template':'process.js', view:view }, function(error, processEmu){
      if(error) return callback(error);

      return templating.render({ 'template':'library.js', 'view':{ node:true, include_process:!options.noprocess }, 'partials':{ 'path':path, 'process':processEmu } }, callback);
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

  templating.render({ 'template':'module.js', 'view':view, 'partials':{ 'content':options.module.content } }, callback);
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
    };
  });

  map.async(renderModule, modules, function(error, renderedModules){
    if(error) {
      callback(error);
      return;
    }

    templating.render({ 'template':'package.js', 'view':view, 'partials':{ 'modules':renderedModules.join('\n\n') } }, callback);
  });
}

function renderWrapper(options, callback){
  logging.trace('Rendering wrapper...');
  renderLibrary({ 'node':options.node, 'debug':options.debug, 'noprocess': options.noprocess }, function(error, librarySC){
    if(error){
      callback(error);
      return;
    }

    var view = {
      'name': options.treeName,
      'debug': options.debug,
    };

    options.tie && ( view.ties = (function(){
      var ties = {}, key;

      var i = options.tie.length;
      while( i -- ){
        ties[ options.tie[i].pkg ] = options.tie[i].obj;
      }

      return JSON.stringify(ties);
    }()) );

    templating.render({
      'template':'wrapper.js',
      'view':view,
      'partials':{
        'node':'',
        'library':librarySC,
        'packages':options.renderedPkgs.join('\n\n\n\n')
      }
    }, callback);
  });
}

render.flattenPkgTree = flattenPkgTree;
module.exports = render;

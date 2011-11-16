var logging = require('./logging'),
    templating = require('./templating'),
    functools =  require('functools'),
    map = functools.map;

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
    if(error) return callback(error); 

    options.renderedPkgs = renderedPkgs;
    
    logging.info('All packages has been built successfully.');
    renderWrapper(options, callback);
  });
};

function renderLibrary(options, callback){
  logging.trace('Rendering library...');

  templating.render({ 'template':'path.js' }, function(error, path){
    if(error) return callback(error);

    templating.render({ 'template':'process.js', view:{ 'node_version':process.version, 'versions':JSON.stringify(process.versions) } }, function(error, processEmu){
      if(error) return callback(error);
      return templating.render({ 'template':'library.js', 'view':{ node:true }, 'partials':{ 'path':path, 'process':processEmu } }, callback);  
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
    }
  });

  map.async(renderModule, modules, function(error, renderedModules){
    if(error) return callback(error);
    templating.render({ 'template':'package.js', 'view':view, 'partials':{ 'modules':renderedModules.join('\n\n') } }, callback);
  });
}

function renderWrapper(options, callback){
  logging.trace('Rendering wrapper...');
  renderLibrary({ 'node':options.node }, function(error, librarySC){
    if(error){
      return callback(error);
    }
    templating.render({ 
      'template':'wrapper.js', 
      'view':{ 'name':options.treeName }, 
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

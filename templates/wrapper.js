var {{ name }} = (function(global, undefined){

  var pkgmap = {},
      global = {},
      library = undefined,
      node = undefined,
      _;

  {{>library}}

  function findPkg(workingPkg, uri){
    var pkg = undefined,
        parent = workingPkg;
    
    var i, len;
    do {
      i = parent.dependencies.length;
      while(i-->0){
        parent.dependencies[i].name == uri && ( pkg = parent.dependencies[i] );
      }

      parent = parent.parent;
    } while(!pkg && parent);

    
    return pkg;
  }

  function findModule(workingModule, uri){
    var module = undefined,
        moduleId = lib.path.join(lib.path.dirname(workingModule.id), uri),
        pkg = workingModule.pkg;

    var i = pkg.modules.length;
    while(i-->0){
      if(pkg.modules[i].id==moduleId){
        module = pkg.modules[i];
        break;
      }
    }

    return module;
  }

  function genRequire(callingModule){
    return function require(uri){
      var module;

      if(/^\./.test(uri)){
        module = findModule(callingModule, uri); 
      } else {
        module = findPkg(callingModule.pkg, uri).main;
      }

      if(!module) throw new Error('Cannot find module "'+uri+'"');

      return module.call();
    }
  }

  function module(parentId, wrapper){
    var parent = pkgmap[parentId],
        ctx = wrapper(parent),
        exports = undefined;

    ctx.require = genRequire(ctx);
    ctx.call = function(){
      if(exports) return exports;
      exports = {};
      ctx.wrapper(ctx, exports, ctx.require, global); 
      return exports;
    }

    if(parent.mainModuleId == ctx.id){ 
      parent.main = ctx;
      !parent.parent && ( _.main = ctx.call );
    }

    parent.modules.push(ctx);
  }

  function pkg(parentId, wrapper){
    
    var parent = pkgmap[parentId],
        ctx = wrapper(parent);

    pkgmap[ctx.id] = ctx;
    !parent && ( pkgmap['main'] = ctx );

    parent && parent.dependencies.push(ctx);
  }

  function require(uri){
    return pkgmap.main.main.require(uri);
  }

  return (_ = {
    'lib':lib,
    'findPkg':findPkg,
    'findModule':findModule,
    'name':'{{ name }}',
    'map':pkgmap,
    'module':module,
    'pkg':pkg,
    'require':require
  });

})(this);

{{>packages}}

if(typeof module != 'undefined' && module.exports ){
  module.exports = {{ name }};
}

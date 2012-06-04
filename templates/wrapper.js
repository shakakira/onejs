var {{ name }} = (function(global, undefined){

  var DEBUG         = {{#debug}}true{{/debug}}{{^debug}}false{{/debug}},
      pkgdefs       = {},
      pkgmap        = {},
      global        = {},
      lib           = undefined,

      nativeRequire = typeof require != 'undefined' && require,
      ties, locals;

  {{#ties}}
ties = {{{ ties }}};
  {{/ties}}

  {{>library}}

  function findPkg(workingPkg, uri){
    return pkgmap[uri];
  }

  function findModule(workingModule, uri){
    var module = undefined,
        moduleId = lib.path.join(lib.path.dirname(workingModule.id), uri).replace(/\.js$/, ''),
        moduleIndexId = lib.path.join(moduleId, 'index'),
        pkg = workingModule.pkg;

    var i = pkg.modules.length,
        id;

    while(i-->0){
      id = pkg.modules[i].id;
      if(id==moduleId || id == moduleIndexId){
        module = pkg.modules[i];
        break;
      }
    }

    return module;
  }

  function genRequire(callingModule){
    return function require(uri){
      var module,
          pkg;

      if(/^\./.test(uri)){
        module = findModule(callingModule, uri);
      } else if ( ties && ties.hasOwnProperty( uri ) ) {
        return ties[ uri ];
      } else {
        pkg = findPkg(callingModule.pkg, uri);

        if(!pkg && nativeRequire){
          try {
            pkg = nativeRequire(uri);
          } catch (nativeRequireError) {}

          if(pkg) return pkg;
        }

        if(!pkg){
          throw new Error('Cannot find module "'+uri+'" @[module: '+callingModule.id+' package: '+callingModule.pkg.name+']');
        }

        module = pkg.main;
      }

      if(!module){
        throw new Error('Cannot find module "'+uri+'" @[module: '+callingModule.id+' package: '+callingModule.pkg.name+']');
      }

      module.parent = callingModule;
      return module.call();
    };
  }

  function module(parentId, wrapper){
    var parent = pkgdefs[parentId],
        mod = wrapper(parent),
        cached = false;

    mod.exports = {};
    mod.require = genRequire(mod);

    mod.call = function(){
      {{^debug}}
      if(cached) {
        return mod.exports;
      }
      cached = true;
      {{/debug}}
      global.require = mod.require;
      mod.wrapper(mod, mod.exports, global, global.Buffer,{{#sandbox_console}} global.console,{{/sandbox_console}} global.process, global.require);
      return mod.exports;
    };

    if(parent.mainModuleId == mod.id){
      parent.main = mod;
      parent.parents.length == 0 && ( locals.main = mod.call );
    }

    parent.modules.push(mod);
  }

  function pkg(/* [ parentId ...], wrapper */){

    var wrapper = arguments[ arguments.length - 1 ],
        parents = Array.prototype.slice.call(arguments, 0, arguments.length - 1).map(function(id){ return pkgdefs[id]; }),
        ctx = wrapper(parents);

    if(pkgdefs.hasOwnProperty(ctx.id)){
      throw new Error('Package#'+ctx.id+' "' + ctx.name + '" has duplication of itself.');
    }

    var i = parents.length;
    while( i -- ){
      parents[i].dependencies.push(ctx);
    }

    pkgdefs[ctx.id] = ctx;
    pkgmap[ctx.name] = ctx;

    arguments.length == 1 && ( pkgdefs['main'] = ctx );
  }

  function mainRequire(uri){
    return pkgdefs.main.main.require(uri);
  }

  function stderr(){
    return lib.process.stderr.content;
  }

  function stdin(){
    return lib.process.stdin.content;
  }

  function stdout(){
    return lib.process.stdout.content;
  }

  return (locals = {
    'lib'        : lib,
    'findPkg'    : findPkg,
    'findModule' : findModule,
    'name'       : '{{ name }}',
    'map'        : pkgdefs,
    'module'     : module,
    'pkg'        : pkg,
    'stderr'     : stderr,
    'stdin'      : stdin,
    'stdout'     : stdout,
    'require'    : mainRequire
{{#debug}}
   ,'debug'      : true
{{/debug}}
  });

})(this);

{{>packages}}

if(typeof module != 'undefined' && module.exports ){
  module.exports = {{ name }};

  if( !module.parent ){
    {{ name }}.main();
  }

};

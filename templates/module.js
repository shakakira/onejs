{{ treeName }}.module({{ parentId }}, function(onejsModParent){

  return {
    'id':'{{ id }}',
    'pkg':onejsModParent,
    'wrapper':function(module, exports, global, Buffer,{{#sandbox_console}} console, {{/sandbox_console}} process, require, undefined){
      {{>content}}
    }
  };

});

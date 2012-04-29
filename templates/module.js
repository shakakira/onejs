{{ treeName }}.module({{ parentId }}, function(onejsModParent){

  return {
    'id':'{{ id }}',
    'pkg':onejsModParent,
    'wrapper':function(module, exports, global, Buffer,  process, require, undefined){
      {{>content}}
    }
  };

});

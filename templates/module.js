{{ treeName }}.module({{ parentId }}, function(parent){

  return {
    'id':'{{ id }}',
    'pkg':parent,
    'wrapper':function(module, exports, require, global, undefined){
      {{>content}}
    }
  };

});

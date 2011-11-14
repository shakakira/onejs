{{ treeName }}.module({{ parentId }}, function(parent){

  return {
    'id':'{{ id }}',
    'pkg':parent,
    'wrapper':function(module, exports, global, Buffer,  process, require, undefined){
      {{>content}}
    }
  };

});

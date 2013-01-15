{{ treeName }}.module({{ parentId }}, function(/* parent */){

  return {
    'id': '{{ id }}',
    'pkg': arguments[0],
    'wrapper': function(module, exports, global, require, undefined){
      {{{content}}}
    }
  };

});

{{ treeName }}.pkg({{ parentId }}, function(parent){

  return {
    'id':{{ id }},
    'name':'{{ name }}',
    'main':undefined,
    'mainModuleId':'{{ main }}',
    'dependencies':[],
    'modules':[],
    'parent':parent
  };

});

{{>modules}}

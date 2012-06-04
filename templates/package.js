{{ treeName }}.pkg({{#hasParent}}{{ parentIds }}, {{/hasParent}}function(parents){

  return {
    'id':{{ id }},
    'name':'{{ name }}',
    'main':undefined,
    'mainModuleId':'{{ main }}',
    'dependencies':[],
    'modules':[],
    'parents':parents
  };

});

{{>modules}}

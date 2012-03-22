lib = (function(exports){
  
  exports.path = (function(exports){ 
    {{>path}}

    return exports;
  })({});

  {{#include_process}}

  global.process = exports.process = (function(exports){
    {{>process}}

    return exports;
  })({});

  {{/include_process}}

  return exports;

})({});

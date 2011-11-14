lib = (function(exports){
  
  exports.path = (function(exports){ 
    {{>path}}

    return exports;
  })({});

  global.process = exports.process = (function(exports){
    {{>process}}

    return exports;
  })({});

  return exports;

})({});

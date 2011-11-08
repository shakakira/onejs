var node = (function(){

  var exports = {};

  exports.path = (function(exports){ 
    {{>node_path}}
  })();

  exports.process = (function(exports){
    {{>node_process}}
  })({});

  return exports;

})();

var kick = require('highkick'),
    puts = require('sys').puts;

kick({ module:require('./tests'), name:'      main' }, function(error, result){
  if(error) throw error;
});

var kick = require('highkick'),
    puts = require('sys').puts;

kick({ module:require('./tests'), name:'main' }, function(error, result){
  if(error) throw error;
  puts('====');
  puts('Ran '+result.len+' tests '  + ( result.fail ? 'with ' + result.fail + ' fail.' : 'without any error.') );
});

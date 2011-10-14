var puts = require('sys').puts,
    colors = require('colors');

function logger(lvl, prefix, color){
  return function(){
    var msg;
    if(module.exports.level<lvl){
      msg = Array.prototype.join.call(arguments, ' ');
      puts((' '+(new Date)+'  ').grey+prefix[color].bold+' '+msg);
    }
  }
}

module.exports = {
  'level':0,
  'debug':logger(1, 'DEBUG   ', 'yellow'),
  'info':logger(2,'INFO    ', 'green'),
  'warn':logger(3,'WARNING ', 'blue'),
  'error':logger(4,'ERROR   ', 'red')
};

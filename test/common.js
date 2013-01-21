var child_process = require('child_process'),
    joinPath      = require('path').join;

function assertListContent(a,b){
  return a.length == b.length && a.every(function(el){
    return b.indexOf(el) > -1;
  });
}

function build(/* [pkg], target, params, callback */){

  var args     = Array.prototype.slice.call(arguments),
      pkg      = args.length == 4 ? args[0] : 'test/packages/example-project',
      target   = args[ args.length == 4 ? 1 : 0 ],
      params   = args[ args.length == 4 ? 2 : 1 ],
      callback = args[ args.length -1 ],

      cmd = [
        './bin/onejs build',
        joinPath( pkg, 'package.json' ),
        target
      ].concat(params).join(' ');

  var proc = child_process.exec(cmd);

  proc.on('exit', function(code){
    callback();
  });
}

function moduleFilenames(modules){
  return modules.map(function(el){ return el.filename; });
}


module.exports = {
  'moduleFilenames': moduleFilenames,
  'assertListContent': assertListContent,
  'build': build
}

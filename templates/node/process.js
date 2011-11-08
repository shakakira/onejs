/**
 * This is module's purpose is to emulate NodeJS' process object on web browsers. It's not an alternative 
 * and/or partly implementation of the "process" object.
 */

function Buffer(size){
  this.content = '';
};

Buffer.prototype.isBuffer = function isBuffer(){
  return true;
};

Buffer.prototype.write = function write(string){
  this.content += string;
};

function Stream(writable, readable){
  this.buffer = new Buffer;
  this.emulation = true;
  this.readable = readable;
  this.writable = writable;
  this.type = 'file';

  if(!writable){
    delete this.write;
  }
};

Stream.prototype.write = function write(string){
  return this.buffer.write(string);
}

function notImplemented(){
  console.warn('Not Implemented.');
}

exports.binding = (function(){
  
  var table = {
    'buffer':{ 'Buffer':Buffer, 'SlowBuffer':Buffer }
  };

  return function binding(bname){
    if(!table.hasOwnProperty(bname)){
      throw new Error('No such module.');
    }

    return table[bname];
  };

})();

exports.argv = ['node','one.js'];

exports.env = {};

exports.nextTick = function nextTick(fn){
  return setTimeout(fn, 0);
};

exports.stderr = new Stream(true, false);
exports.stdin = new Stream(false, true);
exports.stdout = new Stream(true, false);

exports.version = '{{ node_version }}';

exports.versions = {{ versions }};

/**
 * void definitions
 */

exports.pid = 
exports.uptime = 0;

exports.arch = 
exports.execPath = 
exports.installPrefix = 
exports.platform =
exports.title = '';

exports.chdir = 
exports.cwd = 
exports.exit = 
exports.getgid = 
exports.setgid =
exports.getuid =
exports.setuid =
exports.memoryUsage =
exports.on = 
exports.umask = notImplemented;



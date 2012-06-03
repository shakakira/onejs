var assert   = require('assert'),
    highkick = require('highkick'),
    onejs    = require('../lib/');

function testFind(){
  
}

function testRead(callback){
  onejs.manifest.read('example-project/package.json', function(error, manifest){

    if(error){
      callback(error);
      return;
    }

    assert.equal(manifest.name, "example-project");
    assert.equal(manifest.main, "./lib/a");
    assert.equal(manifest.directories.lib, "./lib");
    assert.equal(manifest.dependencies.dependency, "*");
    assert.equal(manifest.dependencies.sibling, "*");

    callback();

  });
}

module.exports = {
  'testRead': testRead
};



var assert   = require('assert'),
    onejs    = require('../lib/');

function testFind(callback){
  onejs.manifest.find('dependency', 'test/packages/example-project', function(error, filename){

    if(error){
      callback(error);
      return;
    }

    assert.equal( filename, 'test/packages/example-project/node_modules/dependency/package.json');

    onejs.manifest.find('sibling', 'test/packages/example-project/node_modules/dependency/node_modules/subdependency', function(error, filename){

      if(error){
        callback(error);
        return;
      }

      assert.equal( filename, 'test/packages/example-project/node_modules/sibling/package.json');

      onejs.manifest.find('nonexisting', 'example-project', function(error, filename){
        assert.ok(error);
        assert.ok(!filename);
        callback();
      });

    });

  });
}

function testRead(callback){
  onejs.manifest('test/packages/example-project/package.json', function(error, manifest){

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
  'testRead': testRead,
  'testFind': testFind
};



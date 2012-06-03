var assert            = require('assert'),
    highkick          = require('highkick'),
    one               = require('../lib/'),

    utils             = require('./common'),
    assertListContent = utils.assertListContent,
    moduleFilenames   = utils.moduleFilenames;

function testConstruct(callback){

  var ctx1 = {
    'id': 5,
    'parent': undefined,
    'manifest': {
      'name': 'foobar',
      'directories': undefined
    }
  };

  var ctx2 = {
    'id': undefined,
    'manifest': {
      'name': 'quux',
      'directories': {
        'lib': './lib'
      }
    }
  };

  one.pkg.construct(ctx1, function(error, pkg1){
    assert.ok(!error);
    assert.equal(pkg1.id, 5);
    assert.equal(pkg1.name, 'foobar');
    assert.equal(pkg1.parent, undefined);
    assert.ok(pkg1.pkgdict);
    assert.ok(pkg1.dirs);

    ctx2.parent = pkg1;

    one.pkg.construct(ctx2, function(error, pkg2){
      assert.ok(!error);
      assert.equal(pkg2.id, 1);
      assert.equal(pkg2.name, 'quux');
      assert.equal(pkg2.parent, pkg1);
      assert.equal(pkg2.pkgdict, pkg1.pkgdict);
      assert.equal(pkg2.dirs.lib, './lib');

      callback();
    });

  });
}

function testContent(callback){
  one.manifest('example-project/package.json', function(error, manifest){

    if(error){
      callback(error);
      return;
    }

    one.pkg.construct({ 'manifest': manifest, 'wd':'example-project/' }, function(error, pkg){

      if(error){
        callback(error);
        return;
      }

      one.pkg.content(pkg, { '!!':11, 'exclude': ['exclude'] }, function(error, pkg){

        if(error){
          callback(error);
          return;
        }

        var pkgdict, filenames;

        try {
          assert.equal(pkg.id, 1);
          assert.equal(pkg.name, 'example-project');
          assert.equal(pkg.manifest.name, 'example-project');
          assert.equal(pkg.dependencies.length, 3);
          assert.equal(pkg.main.filename, 'a.js');

          pkgdict = Object.keys(pkg.pkgdict);

          assert.equal(pkgdict.length, 5);
          assert.equal(pkgdict[0], 'example-project');
          assert.equal(pkgdict[1], 'dependency');
          assert.equal(pkgdict[2], 'subdependency');
          assert.equal(pkgdict[3], 'sibling');

          assert.ok(assertListContent( moduleFilenames(pkg.modules), ['web.js', 'a.js', 'b.js']));


          assert.ok(assertListContent( moduleFilenames(pkg.pkgdict.dependency.modules), ['f.js','g.js']));

          assert.ok(assertListContent( moduleFilenames(pkg.pkgdict.subdependency.modules ), ['i.js']));

          assert.ok(assertListContent( moduleFilenames(pkg.pkgdict.sibling.modules), ['p/index.js', 'p/r.js', 's/t.js', 'n.js']));

          callback();
        } catch(err){
          callback(err);
        }

      });

    });

  });

}

module.exports = {
  'testConstruct': testConstruct,
  'testLoad': testContent
};

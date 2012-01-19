var one               = require('../lib/one'),
    templating        = require('../lib/templating'),
    render            = require('../lib/render'),

    assert            = require('assert'),
    fs                = require('fs'),
    kick              = require('highkick'),

    common            = require('./common'),
    moduleFilenames   = common.moduleFilenames,
    verifyListContent = common.verifyListContent;

one.quiet(true);

function init(options, callback){
  callback();
}


function test_verifyListContent(callback){
  assert.ok(verifyListContent([3,1,4],[4,3,1]));
  assert.ok(!verifyListContent([3,[1],4],[4,3,[1]]));
  assert.ok(!verifyListContent([3,1,4],[3,1,6]));
  assert.ok(!verifyListContent([3,1,4],[3,1,4,6]));
  callback();
}

function test_build(callback){
  one.build({ 'manifestPath':'example-project/package.json' }, function(error, sourceCode){
    if(error) return callback(error);
    one.save('tmp/built.js', sourceCode, function(error){
      if(error) return callback(error);
      kick({ module:require('./templates'), 'silent': true, 'name':'built file', 'target':'../tmp/built.js' },function(error,result){
        if(error) return callback(error);
        callback(result.fail ? new Error('Build tests failed') : undefined);
      });
    });
  });
}

function test_collectDeps(callback){
  var pkg = {
    'name':'example-project',
    'manifest':{
      'dependencies':{
        'dependency':'*',
        'sibling':'*'
      }
    },
    'wd':'example-project/',
    'pkgDict':{}
  };

  one.collectDeps(pkg, { id:templating.idGenerator() }, function(error, deps){
    if(error) return callback(error);
    assert.equal(deps.length, 2);
    assert.equal(deps[0].name, 'dependency');
    assert.equal(deps[0].parent, pkg);
    assert.equal(deps[0].dependencies[0].name, 'subdependency');
    assert.equal(deps[0].dependencies[0].parent, deps[0]);
    assert.equal(deps[1].name, 'sibling');
    callback();
  });
}

function test_id(callback){
  var i = templating.id();
  assert.equal(typeof i, 'number');
  assert.equal(templating.id(), i+1);

  callback();
}

function test_loadPkg(callback){
  one.loadPkg('example-project/package.json', undefined, { id:templating.idGenerator(), 'azer':1 }, function(error, pkg){
    if(error) return callback(error);

    var pkgDict, filenames;

    try {
      assert.equal(pkg.id, 1);
      assert.equal(pkg.name, 'example-project');
      assert.equal(pkg.manifest.name, 'example-project');
      assert.equal(pkg.dependencies.length, 2);
      assert.equal(pkg.main.filename, 'a.js');

      pkgDict = Object.keys(pkg.pkgDict);

      assert.equal(pkgDict.length, 4);
      assert.equal(pkgDict[0], 'example-project');
      assert.equal(pkgDict[1], 'dependency');
      assert.equal(pkgDict[2], 'subdependency');
      assert.equal(pkgDict[3], 'sibling');

      assert.ok(verifyListContent( moduleFilenames(pkg.modules), ['web.js', 'a.js', 'b.js']));


      assert.ok(verifyListContent( moduleFilenames(pkg.pkgDict.dependency.modules), ['f.js','g.js']));

      assert.ok(verifyListContent( moduleFilenames(pkg.pkgDict.subdependency.modules ), ['i.js', 'j.js']));

      assert.ok(verifyListContent( moduleFilenames(pkg.pkgDict.sibling.modules), ['p/r.js', 's/t.js', 'n.js']));

      callback();
    } catch(err){
      callback(err);
    }
  });
}

function test_collectModules(callback){
  one.collectModules({ 'name':'example-project', 'dirs':{'lib':'lib'}, 'wd':'example-project/' }, function(error, modules){
    try {
      assert.ok(verifyListContent(moduleFilenames(modules), ['a.js', 'b.js','web.js']));
      callback();
    } catch(exc) {
      callback(exc);
    }
  });
}


function test_filterFilename(callback){

  var legalPaths = ['foo.js','lib/bar/qux.js','lib/qux/quux.js','node_modules/foo/lib/bar.js'],
      illegalPaths = ['lib/foo','lib/qux.j'];

  for(var i = -1, len=legalPaths.length; ++i < len; ){
    assert.ok(one.filterFilename(legalPaths[i]));
  };

  for(var i = -1, len=illegalPaths.length; ++i < len; ){
    assert.ok(!one.filterFilename(illegalPaths[i]));
  };

  callback();
}

function test_loadModule(callback){
  one.loadModule('example-project/lib/a.js', function(error, module){
    try {
      assert.equal(module.name, 'a');
      assert.equal(module.filename, 'example-project/lib/a.js');
      assert.equal(module.content.substring(0,22), 'require(\'dependency\');');
      callback();
    } catch(err){
      callback(err);
    }
  });
}

function test_moduleName(callback){
  assert.equal(one.moduleName('foo.js'),'foo');
  assert.equal(one.moduleName('foo/bar/qux.js'),'qux');
  assert.equal(one.moduleName('foo'));
  assert.equal(one.moduleName('foo/bar/qux'));
  assert.equal(one.moduleName('foo.js/bar.js/qux'));
  assert.equal(one.moduleName('foo.js/bar.js/qux.js.'));
  assert.equal(one.moduleName('qux/quux/c-orge.js'),'c-orge');
  callback();
}

function test_renderPackage(callback){
  throw new Error('not implemented');
}

function test_makeVariableName(callback){
  assert.equal(templating.makeVariableName('fooBar'), 'foobar');
  assert.equal(templating.makeVariableName('foo bar'), 'fooBar');
  assert.equal(templating.makeVariableName('foo BAR'), 'fooBar');
  assert.equal(templating.makeVariableName('foo$bar-qux'), 'fooBarQux');
  assert.equal(templating.makeVariableName('foo bar-=-qux'), 'fooBarQux');
  assert.equal(templating.makeVariableName('foo_bar'), 'fooBar');
  assert.equal(templating.makeVariableName('3.14foo15Bar9'), 'foo15bar9');
  callback();
}

function test_loadManifest(callback){
  one.loadManifest('example-project/package.json', function(error, manifest){
    assert.equal(manifest.name, "example-project");
    assert.equal(manifest.main, "./lib/a");
    assert.equal(manifest.directories.lib, "./lib");
    assert.equal(manifest.dependencies.dependency, "*");
    assert.equal(manifest.dependencies.sibling, "*");
    callback();
  });
}

function test_flattenPkgTree(callback){
  var ids = [1,2,3,4,5,6,9,7,8],
      tree = {
        'id':1,
        'dependencies':[
          { 'id': 2 },
          {
            'id':3,
            'dependencies':[
              { 'id':4, 'dependencies':[] },
              {
                'id':5,
                'dependencies':[
                  {
                    'id':6,
                    'dependencies':[
                      { 'id':9 }
                    ]
                  },
                  { 'id':7 },
                  { 'id':8, 'dependencies':[] }
                ]
              }
            ]
          }
        ]
      };

  var flat = render.flattenPkgTree(tree);
  assert.equal(flat.length, 9);

  var i = 9;
  while(i-->0){
    assert.equal(flat[i].id, ids[i]);
  }

  callback();
}


module.exports = {
  'init':init,
  'test_build':test_build,
  'test_collectDeps':test_collectDeps,
  'test_collectModules':test_collectModules,
  'test_filterFilename':test_filterFilename,
  'test_flattenPkgTree':test_flattenPkgTree,
  'test_id':test_id,
  'test_loadManifest':test_loadManifest,
  'test_loadModule':test_loadModule,
  'test_loadPkg':test_loadPkg,
  'test_makeVariableName':test_makeVariableName,
  'test_moduleName':test_moduleName,
  'test_verifyListContent':test_verifyListContent
}

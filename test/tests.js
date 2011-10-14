var one = require('../lib/one'),
    templating = require('../lib/templating'),
    assert = require('assert'),
    fs = require('fs'),
    kick = require('highkick');

one.quite(true);

function verifyListContent(a,b){
  return a.length == b.length && a.every(function(el){
    return b.indexOf(el) > -1;
  });
}

function test_verifyListContent(callback){
  assert.ok(verifyListContent([3,1,4],[4,3,1]));
  assert.ok(!verifyListContent([3,[1],4],[4,3,[1]]));
  assert.ok(!verifyListContent([3,1,4],[3,1,6]));
  assert.ok(!verifyListContent([3,1,4],[3,1,4,6]));
  callback();
}

function test_build(callback){
  one.build('test/example-project', function(error, sourceCode){
    fs.open('/tmp/__package.js', 'w', undefined, function(error, fd){
      fs.write(fd, sourceCode, undefined, undefined, function(err, written){
        if(err) throw err;
        fs.close(fd, function(err){
          if(err) throw err;
          kick({ module:require('./templates'), 'silent':1, 'name':'templates' },function(error,result){
            callback(result.fail);
          });
        });
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
    'workingDir':'test/example-project/',
    'packageDict':{}
  };

  one.collectDeps(pkg, function(error, deps){
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

function test_loadPackage(callback){
  one.loadPackage('test/example-project/', function(error, pkg){
    if(error) return callback(error);
  
    try {
      assert.equal(typeof pkg.id, 'number');
      assert.equal(pkg.name, 'example-project');
      assert.equal(pkg.manifest.name, 'example-project');
      assert.equal(pkg.manifestPath, 'test/example-project/package.json');
      assert.equal(pkg.dependencies.length, 2);
      assert.equal(pkg.main.filename, 'a.js');

      var pkgDict = Object.keys(pkg.packageDict);
      assert.equal(pkgDict.length, 4);
      assert.equal(pkgDict[0], 'example-project');
      assert.equal(pkgDict[1], 'dependency');
      assert.equal(pkgDict[2], 'subdependency');
      assert.equal(pkgDict[3], 'sibling');

      assert.equal(pkg.modules.length, 2);
      assert.equal(pkg.modules[0].filename, 'a.js');
      assert.equal(pkg.modules[1].filename, 'b.js');

      assert.equal(pkg.packageDict.dependency.modules.length, 2);
      verifyListContent(['f.js','g.js'],pkg.packageDict.dependency.modules);

      assert.equal(pkg.packageDict.subdependency.modules.length, 2);
      assert.equal(pkg.packageDict.subdependency.modules[0].filename, 'i.js');
      assert.equal(pkg.packageDict.subdependency.modules[1].filename, 'j.js');

      assert.equal(pkg.packageDict.sibling.modules.length, 3);
      assert.equal(pkg.packageDict.sibling.modules[0].filename, 'p/r.js');
      assert.equal(pkg.packageDict.sibling.modules[2].filename, 's/t.js');
      assert.equal(pkg.packageDict.sibling.modules[1].filename, 'n.js');

      callback();
    } catch(error) {
      callback(error);
    }
  });
}

function test_collectModules(callback){
  one.collectModules({ 'name':'example-project', 'dirs':['lib'], 'workingDir':'test/example-project/' }, function(error, modules){
    try {
      assert.equal(modules.length, 2);
      assert.equal(modules[0].filename, 'a.js');
      assert.equal(modules[1].filename, 'b.js');
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
  one.loadModule('test/example-project/lib/a.js', function(error, module){
    assert.equal(module.name, 'a');
    assert.equal(module.filename, 'test/example-project/lib/a.js');
    assert.equal(module.content, 'require(\'dependency\');\n\nexports.a = true;\n');
    callback();
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

function test_flattenPackageTree(callback){
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

  var flat = one.flattenPackageTree(tree);
  assert.equal(flat.length, 9);

  var i = 9;
  while(i-->0){
    assert.equal(flat[i].id, ids[i]);
  }

  callback();
}


module.exports = {
  'test_id':test_id,
  'test_build':test_build,
  'test_collectModules':test_collectModules,
  'test_filterFilename':test_filterFilename,
  'test_loadPackage':test_loadPackage,
  'test_collectDeps':test_collectDeps,
  'test_loadModule':test_loadModule,
  'test_moduleName':test_moduleName,
  'test_flattenPackageTree':test_flattenPackageTree,
  'test_makeVariableName':test_makeVariableName,
  'test_verifyListContent':test_verifyListContent
}

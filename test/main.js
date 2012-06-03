var one               = require('../lib'),
    templating        = require('../lib/templating'),
    render            = require('../lib/render'),

    assert            = require('assert'),
    fs                = require('fs'),
    kick              = require('highkick'),

    common            = require('./common'),
    moduleFilenames   = common.moduleFilenames,
    assertListContent = common.assertListContent;

//one.quiet(true);

var test_build = kick('./build');

function test_assertListContent(callback){
  assert.ok(assertListContent([3,1,4],[4,3,1]));
  assert.ok(!assertListContent([3,[1],4],[4,3,[1]]));
  assert.ok(!assertListContent([3,1,4],[3,1,6]));
  assert.ok(!assertListContent([3,1,4],[3,1,4,6]));
  callback();
}

function test_build_debug(callback){
  one.build({ 'manifestPath':'example-project/package.json', 'debug': true }, function(error, sourceCode){
    if(error) {
      callback(error);
      return;
    }

    one.save('tmp/built_debug.js', sourceCode, function(error){
      if(error) {
        callback(error);
        return;
      }

      var ep  = require('../tmp/built_debug'),
          now = ep.main().now;

      assert.equal( ep.debug, true);

      setTimeout(function(){
        assert.ok( ep.main().now > now );
        callback();
      }, 10);
    });
  });
}

function test_build_console(callback){
  one.build({ 'manifestPath':'example-project/package.json', 'sandboxConsole': true }, function(error, sourceCode){
    if(error) {
      callback(error);
      return;
    }

    one.save('tmp/built_console.js', sourceCode, function(error){
      if(error) {
        callback(error);
        return;
      }

      var ep  = require('../tmp/built_console'),
          a = ep.main();

      assert.equal(ep.stdout(), 'Elle creuse encore, cette vieville amie au regard fatigué.\n');
      ep.lib.process.stdout.content = '';

      assert.ok(a.console != console);

      assert.equal(ep.stdout(), '');
      assert.equal(ep.stderr(), '');

      a.console.log('foo');
      assert.equal(ep.stdout(), 'foo\n');

      a.console.info('bar');
      assert.equal(ep.stdout(), 'foo\nbar\n');

      a.console.warn('foo');
      assert.equal(ep.stderr(), 'foo\n');
      a.console.error('bar');
      assert.equal(ep.stderr(), 'foo\nbar\n');

      callback();
    });
  });
}

function test_dependencies(callback){
  var pkg = {
    'name':'example-project',
    'manifest':{
      'dependencies':{
        'dependency':'*',
        'sibling':'*'
      }
    },
    'wd':'example-project/',
    'pkgdict':{}
  };

  one.dependencies(pkg, { id:templating.idGenerator() }, function(error, deps){
    if(error){
      callback(error);
      return;
    }

    try {

      assert.equal(deps.length, 3);
      assert.ok(assertListContent( deps.map(function(el){ return el.name; }), ['dependency', 'sibling', 'assert']));

      var dependency = deps.filter(function(el){ return el.name == 'dependency' })[0];
      assert.equal(dependency.dependencies[0].name, 'subdependency');
      assert.equal(dependency.dependencies[0].parent, deps[0]);

      callback();

    } catch(exc) {
      callback(exc);
    }

  });
}

function test_id(callback){
  var i = templating.id();
  assert.equal(typeof i, 'number');
  assert.equal(templating.id(), i+1);

  callback();
}


function test_modules(callback){
  one.modules({ 'name':'example-project', 'dirs':{'lib':'lib'}, 'wd':'example-project/' }, function(error, modules){

    if(error){
      callback(error);
      return;
    }

    assert.ok(assertListContent(moduleFilenames(modules), ['a.js', 'b.js','web.js']));

    one.modules({ 'name': 'subdependency', 'manifest':{ 'main':'i' }, 'wd':'example-project/node_modules/dependency/node_modules/subdependency/' }, function(error, modules){

      if(error){
        callback(error);
        return;
      }

      assert.ok(assertListContent(moduleFilenames(modules), ['i.js']));
      callback();
    });

  });

}


function test_filterFilename(callback){

  var legalPaths = ['foo.js','lib/bar/qux.js','lib/qux/quux.js','node_modules/foo/lib/bar.js'],
      illegalPaths = ['lib/foo','lib/qux.j'];

  for(var i = -1, len=legalPaths.length; ++i < len; ){
    assert.ok(one.modules.filterFilename(legalPaths[i]));
  };

  for(var i = -1, len=illegalPaths.length; ++i < len; ){
    assert.ok(!one.modules.filterFilename(illegalPaths[i]));
  };

  callback();
}

function test_loadModule(callback){
  one.modules.load('example-project/lib/a.js', function(error, module){
    try {
      assert.equal(module.name, 'a');
      assert.equal(module.filename, 'example-project/lib/a.js');
      assert.equal(module.content.substring(0,7), 'console');
      callback();
    } catch(err){
      callback(err);
    }
  });
}

function test_moduleName(callback){
  assert.equal(one.modules.fixname('foo.js'),'foo');
  assert.equal(one.modules.fixname('foo/bar/qux.js'),'qux');
  assert.equal(one.modules.fixname('foo'));
  assert.equal(one.modules.fixname('foo/bar/qux'));
  assert.equal(one.modules.fixname('foo.js/bar.js/qux'));
  assert.equal(one.modules.fixname('foo.js/bar.js/qux.js.'));
  assert.equal(one.modules.fixname('qux/quux/c-orge.js'),'c-orge');
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
  'test_build':test_build,
  'test_build_debug':test_build_debug,
  'test_build_console':test_build_console,
  'test_dependencies':test_dependencies,
  'test_modules':test_modules,
  'test_filterFilename':test_filterFilename,
  'test_flattenPkgTree':test_flattenPkgTree,
  'test_id':test_id,
  'test_loadModule':test_loadModule,
  'test_makeVariableName':test_makeVariableName,
  'test_moduleName':test_moduleName,
  'test_assertListContent':test_assertListContent
};

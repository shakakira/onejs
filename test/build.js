var assert            = require('assert'),
    common            = require('./common'),
    verifyListContent = common.verifyListContent;

function moduleIds(modules){
  return modules.map(function(m){
    return m.id;
  });
}

function init(options, callback){
  callback(null, require(options.target));
}

function test_findPkg(mod, callback){
  assert.equal(mod.findPkg(mod.map.main,'dependency').name, 'dependency');
  assert.equal(mod.findPkg(mod.map[2], 'subdependency').name, 'subdependency');
  assert.equal(mod.findPkg(mod.map[4], 'sibling').name, 'sibling');
  callback();
}

function test_useNativeRequire(mod, callback){
  assert.ok( mod.require('combiner').flatten );
  callback();
}

function test_findModule(mod, callback){
  var g = mod.map[2].modules[1];

  g.id != 'g' && ( g = mod.map[2].modules[0] );

  assert.equal(mod.findModule(mod.map[2].main, 'g'), g);
  callback();
}

function test_globals(mod, callback){
  var globals = mod.require('./a');
  assert.equal(typeof globals.Buffer, 'function');
  assert.ok(globals.process);
  assert.ok(globals.process.env);
  callback();
}

function test_name(mod, callback){
  assert.equal(mod.name, 'exampleProject');
  callback();
}

function test_main(mod, callback){
  assert.equal(mod.main, mod.map.main.main.call);
  callback();
}

function test_moduleTree(mod, callback){
  assert.ok( verifyListContent(moduleIds(mod.map[1].modules), ['a', 'b', 'web'] ) );
  assert.ok( verifyListContent(moduleIds(mod.map[3].modules), ['i'] ) );
  callback();
}

function test_moduleCtx(mod, callback){
  var pkg = mod.map[1],
      a, b, web;

  assert.equal(pkg.modules.length, 3);

  var i = pkg.modules.length;
  while(i-->0){
    switch(pkg.modules[i].id){
      case 'a':
        a = pkg.modules[i];
        break;
      case 'b':
        b = pkg.modules[i];
        break;
      case 'web':
        web = pkg.modules[i];
        break;
    }
  }

  assert.equal(a.id, 'a');
  assert.equal(a.pkg.name, 'example-project');
  assert.equal(typeof a.wrapper, 'function');
  assert.ok(a.require('dependency').f);
  assert.ok(a.require('./b').b);

  var n = mod.map.main.dependencies[ mod.map.main.dependencies[0].name == 'sibling' ? 0 :1 ].main;

  assert.equal(n.id, 'n');
  assert.equal(n.pkg.name, 'sibling');
  assert.equal(typeof n.wrapper, 'function');
  assert.ok(n.require('dependency').f);
  assert.ok(n.require('./p/r').r);

  callback();
}

function test_packageCtx(mod, callback){
  assert.ok(mod.require);
  assert.equal(mod.name, 'exampleProject');

  assert.equal(typeof mod.stderr(), 'string');
  assert.equal(typeof mod.stdin(), 'string');
  assert.equal(typeof mod.stdout(), 'string');
  assert.equal(mod.stdout(), mod.lib.process.stdout.content);
  assert.equal(mod.stdin(), mod.lib.process.stdin.content);
  assert.equal(mod.stderr(), mod.lib.process.stderr.content);

  var p = mod.map[1];
  assert.equal(p.name, 'example-project');
  assert.equal(p.id, 1);
  assert.equal(p.parent);
  assert.equal(p.mainModuleId, 'a');
  assert.equal(p.main.id, 'a');

  assert.ok( verifyListContent(moduleIds(p.modules), ['a', 'b', 'web']) );

  assert.equal(p.dependencies.length, 3);

  callback();
}

function test_packageTree(mod, callback){
  mod.map.main.dependencies.map(function(el){
    console.log('!!', el.name);
  });

  assert.equal(mod.map.main.dependencies.length, 3);
  assert.equal(mod.map.main.dependencies[0].name, 'dependency');
  assert.equal(mod.map.main.dependencies[1].name, 'sibling');
  assert.equal(mod.map.main.dependencies[0].dependencies[0].name, 'subdependency');
  callback();
}

function test_process(mod, callback){
  var proc = mod.lib.process;

  assert.ok(proc);
  assert.equal(typeof proc.Stream, 'function');
  assert.equal(typeof proc.Buffer, 'function');

  assert.equal(proc.binding('buffer').Buffer, proc.Buffer);
  assert.equal(proc.binding('buffer').SlowBuffer, proc.Buffer);

  assert.equal(proc.argv[0], 'onejs');

  assert.ok(proc.env);

  assert.ok(proc.stderr instanceof proc.Stream);
  assert.ok(proc.stdin instanceof proc.Stream);
  assert.ok(proc.stdout instanceof proc.Stream);

  assert.ok(proc.pid == proc.uptime);
  assert.ok(proc.arch == proc.execPath == proc.installPrefix == proc.platform == proc.title == '');

  proc.stdout.write('hello');
  proc.stdout.write(' world');
  assert.equal(proc.stdout.content, 'hello world');

  var isNextTickAsync = false;
  proc.nextTick(function(){
    assert.ok(isNextTickAsync);
    callback();
  });

  isNextTickAsync = true;
}

function test_require(mod, callback){
  assert.ok(mod.require('./b').b);
  assert.ok(mod.require('dependency').f);

  callback();
}

function test_module_caching(mod, callback){
  var now = mod.main().now;
  assert.ok(now > +(new Date)-1000);

  setTimeout(function(){
    assert.equal(mod.main().now, now);
    callback();
  }, 50);
}

function test_parent(mod, callback){
  var a = mod.main(),
      f = a.dependency;

  assert.equal(a.parent, undefined);
  assert.equal(f.parent.id, 'a');

  callback();
}

function test_tie(mod, callback){
  assert.equal(mod.require('proc'), process);
  assert.equal(mod.require('env'), process.env);
  callback();
}

module.exports = {
  'init': init,
  'test_name': test_name,
  'test_packageTree': test_packageTree,
  'test_moduleTree': test_moduleTree,
  'test_packageCtx': test_packageCtx,
  'test_moduleCtx': test_moduleCtx,
  'test_findPkg': test_findPkg,
  'test_findModule': test_findModule,
  'test_require': test_require,
  'test_module_caching': test_module_caching,
  'test_process': test_process,
  'test_globals': test_globals,
  'test_useNativeRequire': test_useNativeRequire,
  'test_main': test_main,
  'test_parent': test_parent,
  'test_tie': test_tie
};

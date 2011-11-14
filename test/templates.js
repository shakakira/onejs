var assert = require('assert');

function init(options, callback){

  callback(null, require(options.target));
}

function test_name(mod, callback){
  assert.equal(mod.name, 'exampleProject');
  callback();
}

function test_findPkg(mod, callback){
  assert.equal(mod.findPkg(mod.map.main,'dependency').name, 'dependency');
  assert.equal(mod.findPkg(mod.map[2], 'subdependency').name, 'subdependency');
  assert.equal(mod.findPkg(mod.map[4], 'sibling').name, 'sibling');
  callback();
}

function test_findModule(mod, callback){
  assert.equal(mod.findModule(mod.map[2].main, 'g'), mod.map[2].modules[1]);
  callback();
}

function test_packageTree(mod, callback){
  assert.equal(mod.map.main.dependencies.length, 2);
  assert.equal(mod.map.main.dependencies[0].name, 'dependency');
  assert.equal(mod.map.main.dependencies[1].name, 'sibling');
  assert.equal(mod.map.main.dependencies[0].dependencies[0].name, 'subdependency');
  callback();
}

function test_moduleTree(mod, callback){
  assert.equal(mod.map[1].modules.length, 2);
  assert.equal(mod.map[1].modules[0].id, 'a');
  assert.equal(mod.map[1].modules[1].id, 'b');

  assert.equal(mod.map[3].modules.length, 2);
  assert.equal(mod.map[3].modules[0].id, 'i');
  assert.equal(mod.map[3].modules[1].id, 'j');
  callback();
}

function test_packageCtx(mod, callback){
  var p = mod.map[1];
  assert.equal(p.name, 'example-project');
  assert.equal(p.id, 1);
  assert.equal(p.parent);
  assert.equal(p.mainModuleId, 'a');
  assert.equal(p.main.id, 'a');
  assert.equal(p.modules.length, 2);
  assert.equal(p.modules[0].id, 'a');
  assert.equal(p.modules[1].id, 'b');
  assert.equal(p.dependencies.length, 2);

  callback();
}

function test_moduleCtx(mod, callback){
  var m = mod.map[1].modules[0];
  assert.equal(m.id, 'a');
  assert.equal(m.pkg.name, 'example-project');
  assert.equal(typeof m.wrapper, 'function');
  assert.ok(m.require('dependency').f);
  assert.ok(m.require('./b').b);

  m = mod.map.main.dependencies[ mod.map.main.dependencies[0].name == 'sibling' ? 0 :1 ].main;
  assert.equal(m.id, 'n');
  assert.equal(m.pkg.name, 'sibling');
  assert.equal(typeof m.wrapper, 'function');
  assert.ok(m.require('dependency').f);
  assert.ok(m.require('./p/r').r);

  callback();
}

function test_main(mod, callback){
  assert.equal(mod.main, mod.map.main.main.call);
  callback();
}

function test_process(mod, callback){
  var proc = mod.lib.process;

  assert.ok(proc);
  assert.equal(typeof proc.Stream, 'function');
  assert.equal(typeof proc.Buffer, 'function');

  assert.equal(proc.argv.length, 2);
  assert.equal(proc.argv[0], 'node');
  assert.equal(proc.argv[1], 'one.js');

  assert.ok(proc.env);

  assert.ok(proc.stderr instanceof proc.Stream);
  assert.ok(proc.stdin instanceof proc.Stream);
  assert.ok(proc.stdout instanceof proc.Stream);

  assert.equal(proc.version, process.version);
  assert.equal(proc.versions.node, process.versions.node);
  assert.equal(proc.versions.v8, process.versions.v8);

  assert.ok(proc.pid == proc.uptime);
  assert.ok(proc.arch == proc.execPath == proc.installPrefix == proc.platform == proc.title == '');

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

function test_globals(mod, callback){
  var globals = mod.require('./a');
  assert.equal(typeof globals.Buffer, 'function');
  assert.ok(globals.process);
  assert.ok(globals.process.env);
  callback();
}

module.exports = {
  'init':init,
  'test_name':test_name,
  'test_packageTree':test_packageTree,
  'test_moduleTree':test_moduleTree,
  'test_packageCtx':test_packageCtx,
  'test_moduleCtx':test_moduleCtx,
  'test_findPkg':test_findPkg,
  'test_findModule':test_findModule,
  'test_require':test_require,
  'test_process':test_process,
  'test_globals':test_globals,
  'test_main':test_main
};

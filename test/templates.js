var assert = require('assert');

function init(options, callback){
  callback(null, options.node, require(options.target));
}

function test_name(node, mod, callback){
  assert.equal(mod.name, 'exampleProject');
  callback();
}

function test_findPkg(node, mod, callback){
  assert.equal(mod.findPkg(mod.map.main,'dependency').name, 'dependency');
  assert.equal(mod.findPkg(mod.map[2], 'subdependency').name, 'subdependency');
  assert.equal(mod.findPkg(mod.map[4], 'sibling').name, 'sibling');
  callback();
}

function test_findModule(node, mod, callback){
  assert.equal(mod.findModule(mod.map[2].main, 'g'), mod.map[2].modules[1]);
  callback();
}

function test_packageTree(node, mod, callback){
  assert.equal(mod.map.main.dependencies.length, 2);
  assert.equal(mod.map.main.dependencies[0].name, 'dependency');
  assert.equal(mod.map.main.dependencies[1].name, 'sibling');
  assert.equal(mod.map.main.dependencies[0].dependencies[0].name, 'subdependency');
  callback();
}

function test_moduleTree(node, mod, callback){
  assert.equal(mod.map[1].modules.length, 2);
  assert.equal(mod.map[1].modules[0].id, 'a');
  assert.equal(mod.map[1].modules[1].id, 'b');

  assert.equal(mod.map[3].modules.length, 2);
  assert.equal(mod.map[3].modules[0].id, 'i');
  assert.equal(mod.map[3].modules[1].id, 'j');
  callback();
}

function test_packageCtx(node, mod, callback){
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

function test_moduleCtx(node, mod, callback){
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

function test_main(node, mod, callback){
  assert.equal(mod.main, mod.map.main.main.call);
  callback();
}

function test_require(node, mod, callback){
  assert.ok(mod.require('./b').b);
  assert.ok(mod.require('dependency').f);
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
  'test_main':test_main
}

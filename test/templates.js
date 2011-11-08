var assert = require('assert');

function init(){
  return require('../tmp/light.js');
}

function test_name(wrapper, callback){
  assert.equal(wrapper.name, 'exampleProject');
  callback();
}

function test_findPkg(wrapper, callback){
  assert.equal(wrapper.findPkg(wrapper.map.main,'dependency').name, 'dependency');
  assert.equal(wrapper.findPkg(wrapper.map[2], 'subdependency').name, 'subdependency');
  assert.equal(wrapper.findPkg(wrapper.map[4], 'sibling').name, 'sibling');
  callback();
}

function test_findModule(wrapper, callback){
  assert.equal(wrapper.findModule(wrapper.map[2].main, 'g'), wrapper.map[2].modules[1]);
  callback();
}

function test_packageTree(wrapper, callback){
  assert.equal(wrapper.map.main.dependencies.length, 2);
  assert.equal(wrapper.map.main.dependencies[0].name, 'dependency');
  assert.equal(wrapper.map.main.dependencies[1].name, 'sibling');
  assert.equal(wrapper.map.main.dependencies[0].dependencies[0].name, 'subdependency');
  callback();
}

function test_moduleTree(wrapper, callback){
  assert.equal(wrapper.map[1].modules.length, 2);
  assert.equal(wrapper.map[1].modules[0].id, 'a');
  assert.equal(wrapper.map[1].modules[1].id, 'b');

  assert.equal(wrapper.map[3].modules.length, 2);
  assert.equal(wrapper.map[3].modules[0].id, 'i');
  assert.equal(wrapper.map[3].modules[1].id, 'j');
  callback();
}

function test_packageCtx(wrapper, callback){
  var p = wrapper.map[1];
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

function test_moduleCtx(wrapper, callback){
  var m = wrapper.map[1].modules[0];
  assert.equal(m.id, 'a');
  assert.equal(m.pkg.name, 'example-project');
  assert.equal(typeof m.wrapper, 'function');
  assert.ok(m.require('dependency').f);
  assert.ok(m.require('./b').b);

  m = wrapper.map.main.dependencies[ wrapper.map.main.dependencies[0].name == 'sibling' ? 0 :1 ].main;
  assert.equal(m.id, 'n');
  assert.equal(m.pkg.name, 'sibling');
  assert.equal(typeof m.wrapper, 'function');
  assert.ok(m.require('dependency').f);
  assert.ok(m.require('./p/r').r);

  callback();
}

function test_main(wrapper, callback){
  assert.equal(wrapper.main, wrapper.map.main.main.call);
  callback();
}

function test_require(wrapper, callback){
  assert.ok(wrapper.require('./b').b);
  assert.ok(wrapper.require('dependency').f);
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

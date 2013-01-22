var assert            = require('assert'),
    one               = require('../lib'),
    common            = require('./common'),
    assertListContent = common.assertListContent;

exports.init = function init(options, callback){
  if(options.target){
    callback(undefined, require(options.target));
    return;
  }

  common.build('test/packages/sai', 'tmp/built_via_manifest_opts.js', [], function(exitCode){
    callback(undefined, require('../tmp/built_via_manifest_opts'));
  });
}

exports.testExcluding = function(sai, done){
  assert.deepEqual(['monouchi', 'sai', 'main', 'tsume'], Object.keys(sai.packages));
  done();
};

exports.testTies = function(sai, done){
  assert.equal(Math.PI, sai.require('pi'));
  assert.equal(Number.MAX_VALUE, sai.require('max'));
  done();
};

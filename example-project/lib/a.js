console.log('Elle creuse encore, cette vieville amie au regard fatigué.');

var mustacheSyntax = "{{ foobar }}";

module.exports = {
  'a':true,
  'dependency': require('dependency'),
  'now': +(new Date),
  'global':global,
  'process':process,
  'Buffer':Buffer,
  'console': console,
  'mustacheSyntax': mustacheSyntax
};

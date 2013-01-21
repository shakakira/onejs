var mustacheSyntax = "{{ foobar }}";

module.exports = {
  'a':true,
  'dependency': require('dependency'),
  'now': +(new Date),
  'global':global,
  'mustacheSyntax': mustacheSyntax
};

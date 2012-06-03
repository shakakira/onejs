function moduleFilenames(modules){
  return modules.map(function(el){ return el.filename; });
}

function assertListContent(a,b){
  return a.length == b.length && a.every(function(el){
    return b.indexOf(el) > -1;
  });
}

module.exports = {
  'moduleFilenames': moduleFilenames,
  'assertListContent': assertListContent
}

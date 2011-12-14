function moduleFilenames(modules){
  return modules.map(function(el){ return el.filename; });
}

function verifyListContent(a,b){
  return a.length == b.length && a.every(function(el){
    return b.indexOf(el) > -1;
  });
}

module.exports = {
  'moduleFilenames': moduleFilenames,
  'verifyListContent': verifyListContent
}

module.exports = function(parentPackage, buildOptions){
  var result = buildOptions.exclude || [];

  parentPackage.manifest.web && parentPackage.manifest.web.exclude && parentPackage.manifest.web.exclude.forEach(function(el){
    result.push(el);
  });

   return result;
};

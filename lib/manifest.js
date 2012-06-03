var boxcars = require('boxcars'),
    logging = require('./logging');

function find(){
  throw new Error("Not implemented");
}

function read(filename, callback){
  logging.debug('Reading the manifest @ "%s"', filename);

  var manifest;

  boxcars(filename)(function(error, bf){

    if(error){
      logging.error('Failed to read the file "%s"', filename);
      callback(error);
      return;
    }

    logging.debug('Parsing the manifest @ "%s"', filename);

    try {

      manifest = JSON.parse(bf);
      logging.trace('Manifest file "%s" loaded and parsed successfully.', filename);

    } catch(exc) {

      logging.error('Failed to parse the manifest @ "%s"', filename);
      error = exc;

    }

    callback(error, manifest);

  });

}

module.exports = read;
module.exports.find = find;

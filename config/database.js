module.exports = ( () => {

  var mongoose = require('mongoose');

  // Configure mongoose to use the ES6 Promise
  mongoose.Promise = global.Promise;

  var mod = {
    url: "mongodb://titleCloudApp:4!wHnmcj!f8FFkHb$$WV9JEGX&qe@dv-mongo-a:27017,dv-mongo-b:27017/titleCloud?replicaSet=rs0"
  };

  return mod;

}());


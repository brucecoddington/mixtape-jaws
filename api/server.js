var fs = require('fs'),
  Q = require('q'),
  locomotive = require('locomotive'),
  https = require('https'),
  privateKey = fs.readFileSync(__dirname + '/config/cert/privatekey.pem').toString(),
  certificate = fs.readFileSync(__dirname + '/config/cert/certificate.pem').toString(),
  credentials = {key: privateKey, cert: certificate};

var sendReady = function sendReady() {
    //If this process was forked, send the ready message to whoever spawned it
    if (process.send) {
      process.send({ status: 'ready' });
    }
  };

  locomotive.boot('./api/', process.env.NODE_ENV, function (err, app) {
    if (err){
      throw err;
    }

    console.log('process env : ' + process.env.NODE_ENV);
    console.log('app.settings.port: ' + app.settings.port);
    console.log('app.settings.securePort: ' + app.settings.securePort);
    console.log('app.settings.env: ' + app.settings.env);

    var keys = Object.keys(app.settings);
    console.log('keys : ' + keys);
    for (var a = 0; a < keys.length; a++) {
      var key = keys[a];
      console.log(key + ": " + app.settings[key]);
    }

    // Start the HTTP server
    // Q.fcall(function() {
    //   var deferred = Q.defer();
    //   var server = app.listen(app.settings.port, function () {
    //     console.log("Ready for requests on port %d in %s mode.", app.settings.port, app.settings.env);
    //     deferred.resolve();
    //   });
    //   return deferred.promise;
    // })
    Q.nfcall(app.listen(app.settings.port))
    // Then send the ready
      .then(function() {
        console.log("Ready for requests on port %d in %s mode.", app.settings.port, app.settings.env);
        console.log('Server is ready and serving on HTTP and HTTPS.');
        console.log('Returning ready to the parent process if any.');
        if (process.send) {
          process.send({ status: 'ready' });
        }
      });

  });


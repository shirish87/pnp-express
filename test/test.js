
var AppLoader = require('../index')
  , config = require('./config')
  , path = require('path')


describe("Functionality", function () {
    // TODO: More tests

    it("Loads express app", function (done) {

        var plugins = [{
            path: path.resolve('./test/plugins')
        }];

        var appLoader = new AppLoader(config, { plugins: plugins });
        appLoader.hook('postStart', function (config, app, port) {
            console.log('Express started on port', port);
            done();
        });

        appLoader.init();
        appLoader.start();
    });

});
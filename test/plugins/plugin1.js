var debug = require('debug')('plugin1')

module.exports.name = 'plugin1';

module.exports.priority = 1;


module.exports.init = function (hook) {
    hook('postStart', function (config, app, port) {
        debug('invoked: postStart: ' + port);
    });
}
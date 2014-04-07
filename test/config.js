var convict = require('convict')
  , path = require('path')

// define a schema
var conf = convict({
    env: {
        doc: 'The applicaton environment.',
        format: ['production', 'development', 'test'],
        default: 'development',
        env: 'NODE_ENV'
    },
    ip: {
        doc: 'The IP address to bind.',
        format: 'ipaddress',
        default: '127.0.0.1',
        env: 'IP_ADDRESS'
    },
    port: {
        doc: 'The port to bind.',
        format: 'port',
        default: 3000,
        env: 'PORT'
    },
    rootDir: {
        doc: 'Root directory of the project',
        format: '*',
        default: __dirname,
        env: 'ROOT_DIR'
    },
    viewEngine: {
        doc: 'View engine to be used by express',
        format: '*',
        default: 'jade'
    },
    viewDir: {
        doc: 'Path to directory containing views',
        format: '*',
        default: path.join(__dirname, 'views')
    },
    staticDir: {
        doc: 'Path to directory containing static files',
        format: '*',
        default: path.join(__dirname, 'public')
    },
    session: {
        doc: 'Session configuration',
        format: '*',
        default: {
            key: '_sess',
            secret: 's3ss10ns3cr34'
        }
    }
});


// load environment dependent configuration
var env = conf.get('env');
conf.loadFile('./test/config/' + env + '.json');

// perform validation
conf.validate();

module.exports = conf;
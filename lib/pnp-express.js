
var express = require('express')
  , RedisStore = require('connect-redis')(express)
  , Plugger = require('plugger')
  , debug = require('debug')('pnp-express')
  , path = require('path')


/**
 * Cache
 */
var slice = Array.prototype.slice;


/**
 * Events that are fired during express' lifecycle
 */
var events = [
    'init'
  , 'preViews'
  , 'postViews'
  , 'preParsers'
  , 'postParsers'
  , 'preSession'
  , 'postSession'
  , 'preStatic'
  , 'postStatic'
  , 'preRouter'
  , 'postRouter'
  , 'preStart'
  , 'postStart'
];


function mirrorHash(arr) {
    if (!Array.isArray(arr)) {
        return false;
    }

    if (arr.length === 0) {
        return {};
    }

    var obj = {};

    arr.forEach(function (item) {
        if (typeof item === 'string') {
            obj[item] = item;
        }
    });

    return obj;
}



/**
 *
 * @param config {Object}     node-convict configuration
 * @param options {Object}    options including 'isSubApp' and 'plugins'
 * @param callback {function} notifies of completion or error
 * @returns {AppLoader}
 * @constructor
 */
function AppLoader(config, options, callback) {
    if (!(this instanceof AppLoader)) {
        return new AppLoader(config, options);
    }

    options = options || {};
    options.plugins = options.plugins || [];

    var self = this
      , plugger
      ;

    this.options = options;
    this.config = config;

    this.env = config.get('env');
    this.rootDir = config.get('rootDir');

    plugger = new Plugger(options.plugins, function (err) {
        if (typeof callback === 'function') {
            callback(err);
        }

        debug('complete', err || true);
    });

    // let plugins register their hooks
    plugger.init();

    [ 'hook', 'seal' ].forEach(function (fn) {
        self[fn] = plugger[fn].bind(plugger);
    });

    this.plugger = plugger;

    this.app = express();
    this.isSubapp = options.isSubapp || false;

    this.events = mirrorHash(events);
}


/**
 * Initializes detected plugins and invokes hooks while setting up express
 */
AppLoader.prototype.init = function () {

    var app = this.app
      , config = this.config
      , events = this.events
      , sessionConfig
      ;


    this.plugger.seal();

    this._dispatchEvent(events.init);

    if (this.env === 'development') {
        app.use(express.logger('dev'));
    }

    if (config.has('viewDir')) {
        this._dispatchEvent(events.preViews);
        app.set('views', config.get('viewDir'));

        if (config.has('viewEngine')) {
            app.set('view engine', config.get('viewEngine'));
        } else {
            app.set('view engine', 'jade');
        }

        this._dispatchEvent(events.postViews);
    }

    this._dispatchEvent(events.preParsers);
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    this._dispatchEvent(events.postParsers);

    if (config.has('session')) {
        sessionConfig = config.get('session');

        this._dispatchEvent(events.preSession);
        app.use(express.cookieParser());

        if (sessionConfig.store && sessionConfig.store.redis) {
            sessionConfig.store = new RedisStore(sessionConfig.store.redis);
            debug('using redis as session store');
        }

        app.use(express.session(sessionConfig));
        this._dispatchEvent(events.postSession);
    } else {
        debug('session disabled');
    }

    if (config.has('staticDir')) {
        this._dispatchEvent(events.preStatic);
        app.use(express.static(config.get('staticDir')));
        if (!this.isSubapp) {
            app.use(express.favicon(path.join(config.get('staticDir'), 'favicon.ico')));
        }

        this._dispatchEvent(events.postStatic);
    } else {
        debug('static disabled');
    }

    this._dispatchEvent(events.preRouter);
    app.use(app.router);
    this._dispatchEvent(events.postRouter);
}



/**
 * Start listening on configured port
 */
AppLoader.prototype.start = function () {
    var events = this.events;

    this._dispatchEvent(events.preStart, this.config.get('port'));
    var port = this.config.get('port');

    var self = this;
    this.app.listen(port, function () {
        debug('Express server listening on port ' + port);
        self._dispatchEvent(events.postStart, port);
    });
}



/**
 * Invoke registered hooks for the specified event
 * @returns {boolean}
 * @private
 */
AppLoader.prototype._dispatchEvent = function () {
    var args = slice.call(arguments);
    if (args.length === 0) {
        debug('_dispatchEvent: invalid args');
        return false;
    }

    var event = args.shift();
    args.unshift(this.app);
    args.unshift(this.config);
    args.unshift(event);

    var plugger = this.plugger;
    debug('invoking ' + event);

    plugger.invoke.apply(plugger, args);
    return true;
}



module.exports = exports = AppLoader;
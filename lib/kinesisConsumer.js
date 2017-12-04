'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _get2 = require('babel-runtime/helpers/get');

var _get3 = _interopRequireDefault(_get2);

var _abstractBaseClass = require('./abstractBaseClass');

var _abstractBaseClass2 = _interopRequireDefault(_abstractBaseClass);

var _createLambdaContext = require('./createLambdaContext');

var _createLambdaContext2 = _interopRequireDefault(_createLambdaContext);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');
var Promise = require('bluebird');

/**
 * Based on ServerlessWebpack.run
 * @param serverless
 * @param slsWebpack
 * @param stats
 * @param functionName
 */
function getRunnableLambda(serverless, slsWebpack, stats, functionName) {
    return function (event) {
        // need to setup env vars first
        var originalEnvironment = _.extend({}, process.env);
        process.env = _.extend({}, serverless.service.provider.environment, serverless.service.functions[functionName].environment, originalEnvironment);

        var compileOutputPaths = slsWebpack.compileOutputPaths; // returns an array, but it should only be 1
        var handler = require(compileOutputPaths[0])[functionName];
        var context = (0, _createLambdaContext2.default)(serverless.service.functions[functionName]);
        return new Promise(function (resolve, reject) {
            return handler(event, context, function (err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    };
}

var MAX_CONSECUTIVE_ERRORS = 10;

var KinesisConsumer = function (_AbstractBaseClass) {
    (0, _inherits3.default)(KinesisConsumer, _AbstractBaseClass);

    function KinesisConsumer(serverless, options) {
        (0, _classCallCheck3.default)(this, KinesisConsumer);

        var _this = (0, _possibleConstructorReturn3.default)(this, (KinesisConsumer.__proto__ || (0, _getPrototypeOf2.default)(KinesisConsumer)).call(this, serverless, options));

        _this.log('Configuring serverless offline -> kinesis consumer');

        _this.awsProvider = serverless.getProvider('aws');
        _this.config = serverless.service.custom && serverless.service.custom.serverlessOfflineLocalstack || {};
        (0, _get3.default)(KinesisConsumer.prototype.__proto__ || (0, _getPrototypeOf2.default)(KinesisConsumer.prototype), 'setDebug', _this).call(_this, _this.config.debug);
        return _this;
    }

    (0, _createClass3.default)(KinesisConsumer, [{
        key: 'runWatcher',
        value: function () {
            var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
                var kinesis, registry, streamIterators, consecutiveErrors, streamResults;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (!(this.config.kinesis && this.config.kinesis.enabled)) {
                                    _context.next = 34;
                                    break;
                                }

                                this.log('Enabling poller');

                                // Create the Kinesis client
                                kinesis = new this.awsProvider.sdk.Kinesis();

                                // Load the registry

                                _context.next = 5;
                                return KinesisConsumer.createRegistry(this.serverless);

                            case 5:
                                registry = _context.sent;
                                _context.next = 8;
                                return Promise.props(_.chain(registry)
                                // Grab keys
                                .keys()
                                // Map to [name, stream description promise]
                                .map(function (name) {
                                    return [name, kinesis.describeStream({ StreamName: name }).promise()];
                                })
                                // Map to [name, iterator promise]
                                .map(function (_ref2) {
                                    var _ref3 = (0, _slicedToArray3.default)(_ref2, 2),
                                        name = _ref3[0],
                                        descP = _ref3[1];

                                    var iterP = descP.then(function (desc) {
                                        return kinesis.getShardIterator({
                                            ShardId: desc.StreamDescription.Shards[0].ShardId,
                                            ShardIteratorType: 'TRIM_HORIZON',
                                            StreamName: name
                                        }).promise();
                                    });
                                    return [name, iterP];
                                })
                                // Back to an object
                                .fromPairs()
                                // Extract iterators
                                .mapValues(function (iterP) {
                                    return iterP.then(function (iter) {
                                        return iter.ShardIterator;
                                    });
                                })
                                // Grab the value
                                .value());

                            case 8:
                                streamIterators = _context.sent;
                                consecutiveErrors = 0;

                            case 10:
                                if (!true) {
                                    _context.next = 34;
                                    break;
                                }

                                // eslint-disable-line no-constant-condition
                                this.debug('Polling Kinesis streams: ' + (0, _stringify2.default)(_.keys(registry)));
                                // Repoll the streams
                                _context.next = 14;
                                return KinesisConsumer._repollStreams(kinesis, streamIterators);

                            case 14:
                                streamResults = _context.sent;
                                _context.prev = 15;
                                _context.next = 18;
                                return KinesisConsumer._runLambdas(streamResults, registry);

                            case 18:
                                _context.next = 27;
                                break;

                            case 20:
                                _context.prev = 20;
                                _context.t0 = _context['catch'](15);

                                consecutiveErrors += 1;

                                if (!(consecutiveErrors > MAX_CONSECUTIVE_ERRORS)) {
                                    _context.next = 26;
                                    break;
                                }

                                this.log('Exceeded maximum number of consecutive errors (' + MAX_CONSECUTIVE_ERRORS + ')');
                                throw _context.t0;

                            case 26:
                                this.log('Failed to run Lambdas with error ' + _context.t0.stack + '. Continuing');

                            case 27:
                                _context.prev = 27;

                                // Update the stream iterators
                                streamIterators = _.mapValues(streamResults, function (result) {
                                    return result.NextShardIterator;
                                });
                                return _context.finish(27);

                            case 30:
                                _context.next = 32;
                                return Promise.delay(this.config.kinesis.intervalMillis);

                            case 32:
                                _context.next = 10;
                                break;

                            case 34:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this, [[15, 20, 27, 30]]);
            }));

            function runWatcher() {
                return _ref.apply(this, arguments);
            }

            return runWatcher;
        }()
    }], [{
        key: 'createRegistry',
        value: function () {
            var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(serverless) {
                var slsWebpack, compileStats, registry, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, functionName, func, streamEvents, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, s, streamName;

                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                // Get a handle on the compiled functions
                                // TODO(msills): Do not rely on this plugin.
                                slsWebpack = _.find(serverless.pluginManager.plugins, function (p) {
                                    return p.constructor.name === 'ServerlessWebpack';
                                });
                                _context2.next = 3;
                                return slsWebpack.compile();

                            case 3:
                                compileStats = _context2.sent;
                                registry = {};
                                _iteratorNormalCompletion = true;
                                _didIteratorError = false;
                                _iteratorError = undefined;
                                _context2.prev = 8;
                                _iterator = (0, _getIterator3.default)(_.keys(serverless.service.functions));

                            case 10:
                                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                                    _context2.next = 36;
                                    break;
                                }

                                functionName = _step.value;
                                func = serverless.service.functions[functionName];
                                // Get the list of streams for the function

                                streamEvents = _.filter(func.events || [], function (e) {
                                    return 'stream' in e;
                                });
                                _iteratorNormalCompletion2 = true;
                                _didIteratorError2 = false;
                                _iteratorError2 = undefined;
                                _context2.prev = 17;

                                for (_iterator2 = (0, _getIterator3.default)(streamEvents); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                    s = _step2.value;
                                    streamName = s.stream.arn.split('/').slice(-1)[0];

                                    registry[streamName] = registry[streamName] || [];
                                    registry[streamName].push(getRunnableLambda(serverless, slsWebpack, compileStats, functionName));
                                }
                                _context2.next = 25;
                                break;

                            case 21:
                                _context2.prev = 21;
                                _context2.t0 = _context2['catch'](17);
                                _didIteratorError2 = true;
                                _iteratorError2 = _context2.t0;

                            case 25:
                                _context2.prev = 25;
                                _context2.prev = 26;

                                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                    _iterator2.return();
                                }

                            case 28:
                                _context2.prev = 28;

                                if (!_didIteratorError2) {
                                    _context2.next = 31;
                                    break;
                                }

                                throw _iteratorError2;

                            case 31:
                                return _context2.finish(28);

                            case 32:
                                return _context2.finish(25);

                            case 33:
                                _iteratorNormalCompletion = true;
                                _context2.next = 10;
                                break;

                            case 36:
                                _context2.next = 42;
                                break;

                            case 38:
                                _context2.prev = 38;
                                _context2.t1 = _context2['catch'](8);
                                _didIteratorError = true;
                                _iteratorError = _context2.t1;

                            case 42:
                                _context2.prev = 42;
                                _context2.prev = 43;

                                if (!_iteratorNormalCompletion && _iterator.return) {
                                    _iterator.return();
                                }

                            case 45:
                                _context2.prev = 45;

                                if (!_didIteratorError) {
                                    _context2.next = 48;
                                    break;
                                }

                                throw _iteratorError;

                            case 48:
                                return _context2.finish(45);

                            case 49:
                                return _context2.finish(42);

                            case 50:
                                return _context2.abrupt('return', registry);

                            case 51:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this, [[8, 38, 42, 50], [17, 21, 25, 33], [26,, 28, 32], [43,, 45, 49]]);
            }));

            function createRegistry(_x) {
                return _ref4.apply(this, arguments);
            }

            return createRegistry;
        }()
    }, {
        key: '_repollStreams',
        value: function () {
            var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(kinesis, streamIterators) {
                var _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, name;

                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                // this.debug(`Polling Kinesis streams: ${JSON.stringify(_.keys(streamIterators))}`);
                                _iteratorNormalCompletion3 = true;
                                _didIteratorError3 = false;
                                _iteratorError3 = undefined;
                                _context3.prev = 3;
                                for (_iterator3 = (0, _getIterator3.default)(_.keys(streamIterators)); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                                    name = _step3.value;

                                    if (streamIterators[name] === null) {
                                        // this.log(`Iterator for stream '${name}' + is closed`);
                                    }
                                }
                                // Get the new values for each stream
                                // name -> [fetch result]
                                _context3.next = 11;
                                break;

                            case 7:
                                _context3.prev = 7;
                                _context3.t0 = _context3['catch'](3);
                                _didIteratorError3 = true;
                                _iteratorError3 = _context3.t0;

                            case 11:
                                _context3.prev = 11;
                                _context3.prev = 12;

                                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                                    _iterator3.return();
                                }

                            case 14:
                                _context3.prev = 14;

                                if (!_didIteratorError3) {
                                    _context3.next = 17;
                                    break;
                                }

                                throw _iteratorError3;

                            case 17:
                                return _context3.finish(14);

                            case 18:
                                return _context3.finish(11);

                            case 19:
                                return _context3.abrupt('return', Promise.props(_.mapValues(streamIterators, function (iter) {
                                    return kinesis.getRecords({
                                        ShardIterator: iter,
                                        Limit: 100
                                    }).promise();
                                })));

                            case 20:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this, [[3, 7, 11, 19], [12,, 14, 18]]);
            }));

            function _repollStreams(_x2, _x3) {
                return _ref5.apply(this, arguments);
            }

            return _repollStreams;
        }()
    }, {
        key: '_runLambdas',
        value: function () {
            var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(streamResults, registry) {
                return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                _context4.next = 2;
                                return Promise.all(_.chain(streamResults).entries().flatMap(function (_ref7) {
                                    var _ref8 = (0, _slicedToArray3.default)(_ref7, 2),
                                        name = _ref8[0],
                                        result = _ref8[1];

                                    // this.debug(`Stream '${name}' returned ${result.Records.length} records`);
                                    // Parse the records
                                    var records = _.map(result.Records, function (r) {
                                        var data = r.Data;
                                        // try {
                                        //     return JSON.parse(data.toString())
                                        // } catch (err) {
                                        //     return data;
                                        // }
                                        return data;
                                    });
                                    // Apply the functions that use that stream
                                    return registry[name].map(function (f) {
                                        return f({ Records: records });
                                    });
                                }).value());

                            case 2:
                            case 'end':
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));

            function _runLambdas(_x4, _x5) {
                return _ref6.apply(this, arguments);
            }

            return _runLambdas;
        }()
    }]);
    return KinesisConsumer;
}(_abstractBaseClass2.default);

exports.default = KinesisConsumer;
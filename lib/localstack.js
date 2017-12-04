'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Promise = require('bluebird');
var AWS = require('aws-sdk');
var fs = require('fs');
var path = require('path');

var configFilePath = 'node_modules/serverless-offline-localstack/serverlessOfflineLocalstack.json';

var Localstack = function (_AbstractBaseClass) {
    (0, _inherits3.default)(Localstack, _AbstractBaseClass);

    function Localstack(serverless, options) {
        (0, _classCallCheck3.default)(this, Localstack);

        var _this = (0, _possibleConstructorReturn3.default)(this, (Localstack.__proto__ || (0, _getPrototypeOf2.default)(Localstack)).call(this, serverless, options));

        _this.log('Configuring serverless offline -> localstack');

        _this.config = serverless.service.custom && serverless.service.custom.serverlessOfflineLocalstack || {};
        (0, _get3.default)(Localstack.prototype.__proto__ || (0, _getPrototypeOf2.default)(Localstack.prototype), 'setDebug', _this).call(_this, _this.config.debug);
        _this.endpoints = _this.config.endpoints || {};
        _this.endpointFile = _this.config.endpointFile;

        _this.AWS_SERVICES = {
            'apigateway': 4567,
            'cloudformation': 4581,
            'cloudwatch': 4582,
            'lambda': 4574,
            'dynamodb': 4567,
            's3': 4572,
            'ses': 4579,
            'sns': 4575,
            'sqs': 4576
        };

        if (_this.endpointFile) {
            _this.loadEndpointsFromDisk(_this.endpointFile);
        }

        // Intercept Provider requests
        _this.awsProvider = serverless.getProvider('aws');
        _this.awsProviderRequest = _this.awsProvider.request.bind(_this.awsProvider);
        _this.awsProvider.request = _this.interceptRequest.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Localstack, [{
        key: 'reconfigureAWS',
        value: function reconfigureAWS() {
            var host = this.config.host;
            var region = this.config.region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
            var accessKeyId = this.config.accessKeyId || process.env.AWS_ACCESS_KEY_ID || 'none';
            var secretAccessKey = this.config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || 'none';

            var configChanges = {};

            // If a host has been configured, override each service
            if (host) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = (0, _getIterator3.default)((0, _keys2.default)(this.AWS_SERVICES)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var service = _step.value;

                        var port = this.AWS_SERVICES[service];
                        var url = host + ':' + port;

                        this.debug('Reconfiguring service ' + service + ' to use ' + url);
                        configChanges[service.toLowerCase()] = { endpoint: url };
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }

            // Override specific endpoints if specified
            if (this.endpoints) {
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = (0, _getIterator3.default)((0, _keys2.default)(this.endpoints)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var _service = _step2.value;

                        var _url = this.endpoints[_service];

                        this.debug('Reconfiguring service ' + _service + ' to use ' + _url);
                        configChanges[_service.toLowerCase()] = { endpoint: _url };
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }
            }

            // set additional required properties
            configChanges['region'] = region;
            configChanges['accessKeyId'] = accessKeyId;
            configChanges['secretAccessKey'] = secretAccessKey;

            this.debug('Final configuration: ' + (0, _stringify2.default)(configChanges));
            // configure the serverless aws sdk
            this.awsProvider.sdk.config.update(configChanges);
            AWS.config.update(configChanges);
        }
    }, {
        key: 'loadEndpointsFromDisk',
        value: function loadEndpointsFromDisk(endpointFile) {
            var endpointJson = void 0;

            this.debug('Loading endpointJson from ' + endpointFile);

            try {
                endpointJson = JSON.parse(fs.readFileSync(endpointFile));
            } catch (err) {
                throw new ReferenceError('Endpoint: "' + this.endpointFile + '" is invalid: ' + err);
            }

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = (0, _getIterator3.default)((0, _keys2.default)(endpointJson)), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var key = _step3.value;

                    this.debug('Intercepting service ' + key);
                    this.endpoints[key] = endpointJson[key];
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }
        }
    }, {
        key: 'interceptRequest',
        value: function interceptRequest(service, method, params) {
            // Template validation is not supported in LocalStack
            if (method === 'validateTemplate') {
                this.log('Skipping template validation: Unsupported in Localstack');
                return Promise.resolve('');
            }

            return this.awsProviderRequest(service, method, params);
        }
    }, {
        key: 'writeConfigs',
        value: function writeConfigs(configChanges) {
            fs.writeFile(configFilePath, (0, _stringify2.default)(configChanges), function (err) {
                if (err) {
                    throw err;
                }
            });
        }
    }], [{
        key: 'configureAWS',
        value: function configureAWS(AWSp) {
            var contents = fs.readFileSync(configFilePath);
            var configChanges = JSON.parse(contents);
            AWSp.config.update(configChanges);
        }
    }]);
    return Localstack;
}(_abstractBaseClass2.default);

exports.default = Localstack;
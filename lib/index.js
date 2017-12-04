'use strict';

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _localstack = require('./localstack');

var _localstack2 = _interopRequireDefault(_localstack);

var _kinesisConsumer = require('./kinesisConsumer');

var _kinesisConsumer2 = _interopRequireDefault(_kinesisConsumer);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ServerlessOfflineLocalstackPlugin = function () {
    function ServerlessOfflineLocalstackPlugin(serverless, options) {
        var _this = this;

        (0, _classCallCheck3.default)(this, ServerlessOfflineLocalstackPlugin);

        this.serverless = serverless;
        this.options = options;

        this.localstack = new _localstack2.default(serverless, options);
        this.localstack.reconfigureAWS();
        this.kinesisConsumer = new _kinesisConsumer2.default(serverless, options);

        this.commands = {
            deploy: {}
        };

        this.hooks = {
            'before:invoke:local:invoke': function beforeInvokeLocalInvoke() {
                return Promise.bind(_this.localstack).then(_this.localstack.reconfigureAWS);
            },
            'webpack:invoke:invoke': function webpackInvokeInvoke() {
                return Promise.bind(_this.localstack).then(_this.localstack.reconfigureAWS);
            },
            'before:offline:start': function beforeOfflineStart() {
                return Promise.resolve(Promise.bind(_this.localstack).then(_this.localstack.reconfigureAWS)).then(Promise.bind(_this.kinesisConsumer).then(_this.kinesisConsumer.runWatcher));
            }
        };
    }

    (0, _createClass3.default)(ServerlessOfflineLocalstackPlugin, null, [{
        key: 'configureAWS',
        value: function configureAWS(AWS) {
            _localstack2.default.configureAWS(AWS);
        }
    }]);
    return ServerlessOfflineLocalstackPlugin;
}();

module.exports = ServerlessOfflineLocalstackPlugin;
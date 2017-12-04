"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var AbstractBaseClass = function () {
    function AbstractBaseClass(serverless, options) {
        (0, _classCallCheck3.default)(this, AbstractBaseClass);

        this.serverless = serverless;
        this.options = options;
        this.isDebug = false;
    }

    (0, _createClass3.default)(AbstractBaseClass, [{
        key: "setDebug",
        value: function setDebug(debug) {
            this.isDebug = debug;
        }
    }, {
        key: "log",
        value: function log(msg) {
            this.serverless.cli.log.call(this.serverless.cli, msg);
        }
    }, {
        key: "debug",
        value: function debug(msg) {
            if (this.isDebug) {
                this.log(msg);
            }
        }
    }]);
    return AbstractBaseClass;
}();

exports.default = AbstractBaseClass;
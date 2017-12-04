'use strict';

/*
 Mimicks the lambda context object
 http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 */

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = createLambdaContext;
function createLambdaContext(fun, cb) {

    var functionName = fun.name;
    var endTime = new Date().getTime() + (fun.timeout ? fun.timeout * 1000 : 6000);
    var done = typeof cb === 'function' ? cb : function (x, y) {
        return x || y;
    }; // eslint-disable-line no-extra-parens

    return {
        /* Methods */
        done: done,
        succeed: function succeed(res) {
            return done(null, res);
        },
        fail: function fail(err) {
            return done(err, null);
        },
        getRemainingTimeInMillis: function getRemainingTimeInMillis() {
            return endTime - new Date().getTime();
        },

        /* Properties */
        functionName: functionName,
        memoryLimitInMB: fun.memorySize,
        functionVersion: 'offline_functionVersion_for_' + functionName,
        invokedFunctionArn: 'offline_invokedFunctionArn_for_' + functionName,
        awsRequestId: 'offline_awsRequestId_' + Math.random().toString(10).slice(2),
        logGroupName: 'offline_logGroupName_for_' + functionName,
        logStreamName: 'offline_logStreamName_for_' + functionName,
        identity: {},
        clientContext: {}
    };
}
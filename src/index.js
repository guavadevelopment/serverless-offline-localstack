'use strict';

import * as Promise from 'bluebird';

import Localstack from './localstack';
import KinesisConsumer from './kinesisConsumer';

class ServerlessOfflineLocalstackPlugin {

    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.config = serverless.service.custom && serverless.service.custom.serverlessOfflineLocalstack || {};
        
        let stage = this.options.stage || serverless.service.provider.stage || 'dev';
        if(this.config.stages && this.config.stages.indexOf(stage) !== -1) {
            this.localstack = new Localstack(serverless, options);
            this.localstack.reconfigureAWS();
            this.kinesisConsumer = new KinesisConsumer(serverless, options);

            this.commands = {
                deploy: {}
            };

            this.hooks = {
                'before:invoke:local:invoke': () => Promise.bind(this.localstack)
                    .then(this.localstack.reconfigureAWS),
                'webpack:invoke:invoke': () => Promise.bind(this.localstack)
                    .then(this.localstack.reconfigureAWS),
                'before:offline:start': () => Promise.resolve(
                    Promise.bind(this.localstack).then(this.localstack.reconfigureAWS),
                ).then(
                    Promise.bind(this.kinesisConsumer).then(this.kinesisConsumer.runWatcher)
                )
            };
        }
    }

    static configureAWS(AWS) {
        Localstack.configureAWS(AWS);
    }
}

module.exports = ServerlessOfflineLocalstackPlugin;

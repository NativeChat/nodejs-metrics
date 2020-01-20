'use strict';

const promBundle = require('express-prom-bundle');

const statsLibrary = require('@progresskinvey/prometheus-stats-library');

const { ExpressMiddlewareDefaultSettings } = require('./constants');

class Metrics {
    constructor({
        logger,
        backend,
        expressMiddlewareProvider,
        expressMiddlewareSettings
    } = {}) {
        this._logger = logger || console;
        this._backend = backend || statsLibrary.getInstance();

        this._setupExpressMiddleware(expressMiddlewareProvider, expressMiddlewareSettings);
    }

    async init() {
        await this._backend.startServer();
        this._logger.info('Monitoring server started.');
    }

    getMonitoringMiddleware() {
        return this._prometheusMiddleware;
    }

    async destroy() {
        await this._backend.stopServer();
        this._logger.info('Monitoring server stopped.');
    }

    _setupExpressMiddleware(expressMiddlewareProvider, expressMiddlewareSettings) {
        if (!this._prometheusMiddleware) {
            const metricsRegister = this._backend.getClient().register;

            if (!expressMiddlewareProvider) {
                // Use the Kinvey registry for the metrics in the middleware.
                promBundle.promClient.register = metricsRegister;
            }

            const settings = Object.assign(ExpressMiddlewareDefaultSettings, expressMiddlewareSettings);

            const provider = expressMiddlewareProvider ? expressMiddlewareProvider(metricsRegister) : promBundle;

            this._prometheusMiddleware = provider(settings);
        }
    }
}

module.exports = { Metrics };

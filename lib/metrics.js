'use strict';

const promBundle = require('express-prom-bundle');

const { PrometheusMetricsBackend } = require('./backends/prometheus');

const { ExpressMiddlewareDefaultSettings, DefaultBackendSettings } = require('./constants');

class Metrics {
    constructor({
        logger,
        backend,
        backendSettings,
        expressMiddlewareProvider,
        expressMiddlewareSettings
    } = {}) {
        this._logger = logger || console;

        this._backend = backend || this._getDefaultBackend(backendSettings);
        this._expressMiddlewareProvider = expressMiddlewareProvider;
        this._expressMiddlewareSettings = expressMiddlewareSettings;
    }

    async init() {
        await this._backend.startServer();
        this._logger.info(`Monitoring server started on port ${this._backend.getServerPort()}.`);
    }

    getMonitoringMiddleware() {
        this._setupExpressMiddleware(this._expressMiddlewareProvider, this._expressMiddlewareSettings);
        return this._prometheusMiddleware;
    }

    async destroy() {
        await this._backend.stopServer();
        this._logger.info('Monitoring server stopped.');
    }

    getServerPort() {
        const port = this._backend.getServerPort();

        return port;
    }

    getClient() {
        return this._backend.getClient();
    }

    _setupExpressMiddleware(expressMiddlewareProvider, expressMiddlewareSettings) {
        if (!this._prometheusMiddleware) {
            const metricsRegister = this._backend.getClient().register;

            if (!expressMiddlewareProvider) {
                // Use the Kinvey registry for the metrics in the middleware.
                promBundle.promClient.register = metricsRegister;
            }

            const settings = Object.assign({}, ExpressMiddlewareDefaultSettings, expressMiddlewareSettings);

            const provider = expressMiddlewareProvider ? expressMiddlewareProvider(metricsRegister) : promBundle;

            this._prometheusMiddleware = provider(settings);
        }
    }

    _getDefaultBackend(backendSettings) {
        const settings = Object.assign({ logger: this._logger }, backendSettings || DefaultBackendSettings);
        const backend = new PrometheusMetricsBackend(settings);

        return backend;
    }
}

module.exports = { Metrics };

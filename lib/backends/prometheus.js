'use strict';

const express = require('express');
const client = require('prom-client');

const { DefaultBackendSettings } = require('../constants');

class PrometheusMetricsBackend {
    constructor({
        logger,
        defaultMetricsTimeout,
        serverPort
    } = DefaultBackendSettings) {
        this._setupClient(defaultMetricsTimeout);

        this._setupServer();

        this._logger = logger;
        this._metricsServer = null;
        this._serverPort = serverPort;
    }

    getClient() {
        return this._client;
    }

    startServer() {
        return new Promise((resolve, reject) => {
            this._metricsServer = this.app.listen(this._serverPort, () => {
                resolve(this._metricsServer);
            });

            this._metricsServer.once('error', reject);
        });
    }

    stopServer() {
        return new Promise((resolve, reject) => {
            if (this._metricsServer && this._metricsServer.address() != null) {
                return this._metricsServer.close((err) => {
                    if (err) {
                        reject(err);

                        return;
                    }

                    resolve();
                });
            }

            resolve();
        });
    }

    _setupClient(defaultMetricsTimeout) {
        this._client = client;
        this._client.collectDefaultMetrics({ timeout: defaultMetricsTimeout });
    }

    _setupServer() {
        this.app = express();

        this.app.get('/metrics', (req, res) => {
            const metrics = this._client.register.metrics({ timestamps: false });

            res.set('Content-Type', this._client.register.contentType);
            res.end(metrics);
        });

        this.app.get('/', (req, res) => {
            res.status(200).json({ status: 'OK' });
        });
    }
}

module.exports = { PrometheusMetricsBackend };

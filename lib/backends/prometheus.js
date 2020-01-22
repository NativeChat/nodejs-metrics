'use strict';

const { createServer } = require('net');

const express = require('express');
const client = require('prom-client');

const { DefaultBackendSettings } = require('../constants');

class PrometheusMetricsBackend {
    constructor({
        logger,
        defaultMetricsTimeout,
        serverPort
    } = DefaultBackendSettings) {
        this._setupServer();

        this._client = client;
        this._logger = logger;
        this._metricsServer = null;
        this._desiredServerPort = serverPort;
        this._serverPort = -1;
        this._defaultMetricsTimeout = defaultMetricsTimeout;
    }

    getClient() {
        return this._client;
    }

    getServerPort() {
        return this._serverPort;
    }

    async startServer() {
        let isResolved = false;

        this._serverPort = await this._getServerPort(this._desiredServerPort);

        await new Promise((resolve, reject) => {
            this._metricsServer = this.app.listen(this._serverPort, () => {
                isResolved = true;

                this._client.collectDefaultMetrics({ timeout: this._defaultMetricsTimeout });

                resolve(this._metricsServer);
            });

            this._metricsServer.once('error', (err) => {
                this._logger.error(err);

                if (!isResolved) {
                    reject(err);
                }
            });
        });
    }

    stopServer() {
        return new Promise((resolve, reject) => {
            if (this._metricsServer && this._metricsServer.address() != null) {
                this._client.register.clear();
                return this._metricsServer.close((err) => {
                    if (err) {
                        reject(err);

                        return;
                    }

                    this._metricsServer.unref();
                    this._metricsServer.removeAllListeners();
                    resolve();
                });
            }

            resolve();
        });
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

    async _getServerPort(port) {
        return new Promise((resolve, reject) => {
            const server = createServer();

            server.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    if (port === 0) {
                        reject(new Error('Cannot allocate random free port'));

                        return;
                    }

                    this._getServerPort(0).then(resolve, reject);
                    return;
                }

                reject(err);
            });

            server.once('listening', () => {
                const serverPort = server.address().port;

                server.close();

                resolve(serverPort);
            });

            server.listen(port);
        });
    }
}

module.exports = { PrometheusMetricsBackend };

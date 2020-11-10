import { AddressInfo, createServer } from "net";
import http from "http";
import express from "express";

import client from "prom-client";
import { ILogger } from "nchat-dev-common";

import { DefaultBackendSettings } from "../constants";
import { IBackendSettings, IMetricsBackend } from "../types";

export class PrometheusMetricsBackend implements IMetricsBackend {
    private _client: typeof client;
    private _logger: ILogger;
    private _metricsServer?: http.Server;
    private _desiredServerPort: number;
    private _serverPort: number;
    private _defaultMetricsTimeout: number;
    private app?: express.Express;

    constructor(settings?: Partial<IBackendSettings>) {
        const {
            logger,
            defaultMetricsTimeout,
            serverPort,
        } = { ...DefaultBackendSettings, ...settings };

        this._setupServer();

        this._client = client;
        this._logger = logger || {
            // tslint:disable-next-line: no-console
            debug: () => console.debug,
            // tslint:disable-next-line: no-console
            info: () => console.log,
            // tslint:disable-next-line: no-console
            warn: () => console.warn,
            // tslint:disable-next-line: no-console
            error: () => console.error,
            child: () => this._logger,
            filterFunction: (x) => x,
        };

        this._desiredServerPort = serverPort || 0;
        this._serverPort = -1;
        this._defaultMetricsTimeout = defaultMetricsTimeout || DefaultBackendSettings.defaultMetricsTimeout || 0;
    }

    public getClient(): IPromClient {
        return this._client;
    }

    public getServerPort(): number {
        return this._serverPort;
    }

    public async startServer(): Promise<void> {
        let isResolved = false;

        this._serverPort = await this._getServerPort(this._desiredServerPort);

        await new Promise((resolve, reject) => {
            if (!this.app) {
                throw new Error("'app' has not been initialized");
            }

            this._metricsServer = this.app.listen(this._serverPort, () => {
                isResolved = true;

                this._client.collectDefaultMetrics({ timeout: this._defaultMetricsTimeout });

                resolve(this._metricsServer);
            });

            this._metricsServer.once("error", (err) => {
                this._logger.error(err);

                if (!isResolved) {
                    reject(err);
                }
            });
        });
    }

    public async stopServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this._metricsServer && this._metricsServer.address() !== null) {
                this._client.register.clear();

                return this._metricsServer.close((err) => {
                    if (err) {
                        reject(err);

                        return;
                    }

                    if (this._metricsServer) {
                        this._metricsServer.unref();
                        this._metricsServer.removeAllListeners();
                    }

                    resolve();
                });
               } else {
                resolve();
            }
        });
    }

    private _setupServer(): viod {
        this.app = express();

        this.app.get("/metrics", (_req, res) => {
            const metrics = this._client.register.metrics({ timestamps: false });

            res.set("Content-Type", this._client.register.contentType);
            res.end(metrics);
        });

        this.app.get("/", (_req, res) => {
            res.status(200).json({ status: "OK" });
        });
    }

    private async _getServerPort(port: number): Promise<number> {
        return new Promise((resolve, reject) => {
            const server = createServer();

            server.once("error", (err: any) => {
                if (err.code === "EADDRINUSE") {
                    if (port === 0) {
                        reject(new Error("Cannot allocate random free port"));

                        return;
                    }

                    this._getServerPort(0).then(resolve, reject);

                    return;
                }

                reject(err);
            });

            server.once("listening", () => {
                const serverPort = (server.address() as AddressInfo).port;

                server.close((err) => {
                    if (err) {
                        reject(err);

                        return;
                    }

                    resolve(serverPort);
                });
            });

            server.listen(port);
        });
    }
}

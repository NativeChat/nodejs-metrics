import { AddressInfo, createServer } from "net";
import http from "http";
import express from "express";

import client from "prom-client";
import { ILogger } from "nchat-dev-common";

import { DefaultBackendSettings } from "../constants";
import { IBackendSettings, IMetricsBackend, IPromClient } from "../types";

export class PrometheusMetricsBackend implements IMetricsBackend {
    private client: typeof client;
    private logger: ILogger;
    private metricsServer?: http.Server;
    private desiredServerPort: number;
    private serverPort: number;
    private defaultMetricsTimeout: number;
    private app?: express.Express;

    constructor(settings?: Partial<IBackendSettings>) {
        const {
            logger,
            defaultMetricsTimeout,
            serverPort,
        } = { ...DefaultBackendSettings, ...settings };

        this.setupServer();

        this.client = client;
        this.logger = logger || {
            // eslint-disable-next-line no-console
            debug: () => console.debug,
            // eslint-disable-next-line no-console
            info: () => console.log,
            // eslint-disable-next-line no-console
            warn: () => console.warn,
            // eslint-disable-next-line no-console
            error: () => console.error,
            child: () => this.logger,
        };

        this.desiredServerPort = serverPort || 0;
        this.serverPort = -1;
        this.defaultMetricsTimeout = defaultMetricsTimeout || DefaultBackendSettings.defaultMetricsTimeout || 0;
    }

    public getClient(): IPromClient {
        return this.client;
    }

    public getServerPort(): number {
        return this.serverPort;
    }

    public async startServer(): Promise<void> {
        let isResolved = false;

        this.serverPort = await this.createServer(this.desiredServerPort);

        await new Promise((resolve, reject) => {
            if (!this.app) {
                throw new Error("'app' has not been initialized");
            }

            this.metricsServer = this.app.listen(this.serverPort, () => {
                isResolved = true;

                this.client.collectDefaultMetrics({ timeout: this.defaultMetricsTimeout });

                resolve(this.metricsServer);
            });

            this.metricsServer.once("error", (err) => {
                this.logger.error(err);

                if (!isResolved) {
                    reject(err);
                }
            });
        });
    }

    public async stopServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.metricsServer && this.metricsServer.address() !== null) {
                this.client.register.clear();

                return this.metricsServer.close((err) => {
                    if (err) {
                        reject(err);

                        return;
                    }

                    if (this.metricsServer) {
                        this.metricsServer.unref();
                        this.metricsServer.removeAllListeners();
                    }

                    resolve();
                });
            }

            resolve();
        });
    }

    private setupServer(): void {
        this.app = express();

        this.app.get("/metrics", (_req, res) => {
            const metrics = this.client.register.metrics({ timestamps: false });

            res.set("Content-Type", this.client.register.contentType);
            res.end(metrics);
        });

        this.app.get("/", (_req, res) => {
            res.status(200).json({ status: "OK" });
        });
    }

    private async createServer(desiredPort: number): Promise<number> {
        return new Promise((resolve, reject) => {
            const server = createServer();

            server.once("error", (err: any) => {
                if (err.code === "EADDRINUSE") {
                    if (desiredPort === 0) {
                        reject(new Error("Cannot allocate random free port"));

                        return;
                    }

                    this.createServer(0).then(resolve, reject);

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

            server.listen(desiredPort);
        });
    }
}

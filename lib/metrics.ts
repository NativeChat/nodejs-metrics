import { RequestHandler } from "express";
import promBundle from "express-prom-bundle";
import { ILogger } from "nchat-dev-common";

import { PrometheusMetricsBackend } from "./backends/prometheus";

import { ExpressMiddlewareDefaultSettings, DefaultBackendSettings } from "./constants";
import { ExpressMiddlewareProvider, IBackendSettings, IExpressMiddlewareSettings, IMetrics, IMetricsBackend, IMetricsOptions, IPromClient } from "./types";

export class Metrics implements IMetrics {
    private _logger: ILogger;
    private _backend: IMetricsBackend;
    private _expressMiddlewareProvider?: ExpressMiddlewareProvider;
    private _expressMiddlewareSettings: IExpressMiddlewareSettings;
    private _prometheusMiddleware?: RequestHandler;

    constructor({
        logger,
        backend,
        backendSettings,
        expressMiddlewareProvider,
        expressMiddlewareSettings,
    }: Partial<IMetricsOptions> = {}) {
        this._logger = logger || { ...console, filterFunction: (x) => x, child: () => this._logger };

        this._backend = backend || this._getDefaultBackend(backendSettings || {});
        this._expressMiddlewareProvider = expressMiddlewareProvider;
        this._expressMiddlewareSettings = expressMiddlewareSettings;
    }

    public async init(): Promise<void> {
        await this._backend.startServer();
        this._logger.info(`Monitoring server started on port ${this._backend.getServerPort()}.`);
    }

    public getMonitoringMiddleware(): RequestHandler {
        this._setupExpressMiddleware(this._expressMiddlewareProvider, this._expressMiddlewareSettings);

        if (!this._prometheusMiddleware) {
            throw new Error("Prometheus middleware is not initialized.");
        }

        return this._prometheusMiddleware;
    }

    public async destroy(): Promise<void> {
        await this._backend.stopServer();
        this._logger.info("Monitoring server stopped.");
    }

    public getServerPort(): number {
        const port = this._backend.getServerPort();

        return port;
    }

    public getClient(): IPromClient {
        return this._backend.getClient();
    }

    private _setupExpressMiddleware(expressMiddlewareProvider: ExpressMiddlewareProvider | undefined, expressMiddlewareSettings: IExpressMiddlewareSettings): void {
        if (!this._prometheusMiddleware) {
            const metricsRegister = this._backend.getClient().register;

            if (!expressMiddlewareProvider) {
                // Use the Kinvey registry for the metrics in the middleware.
                (promBundle as any).promClient.register = metricsRegister;
            }

            const settings = { ...ExpressMiddlewareDefaultSettings, ...expressMiddlewareSettings };

            const provider = expressMiddlewareProvider ? expressMiddlewareProvider(metricsRegister) : promBundle;

            this._prometheusMiddleware = provider(settings);
        }
    }

    private _getDefaultBackend(backendSettings: Partial<IBackendSettings>): IMetricsBackend {
        const settings = {
            logger: this._logger,
            ...DefaultBackendSettings,
            ...backendSettings,
        };
        const backend = new PrometheusMetricsBackend(settings);

        return backend;
    }
}

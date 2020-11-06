import promBundle from "express-prom-bundle";
import { ILogger } from "nchat-dev-common";

import { PrometheusMetricsBackend } from "./backends/prometheus";

import { ExpressMiddlewareDefaultSettings, DefaultBackendSettings } from "./constants";
import { IBackendSettings, IMetricsBackend } from "./types";

export class Metrics {
    private _logger: ILogger;
    private _backend: IMetricsBackend;
    private _expressMiddlewareProvider: any;
    private _expressMiddlewareSettings: any;
    private _prometheusMiddleware: any;

    constructor({
        logger,
        backend,
        backendSettings,
        expressMiddlewareProvider,
        expressMiddlewareSettings,
    } = {} as any) {
        this._logger = logger || console;

        this._backend = backend || this._getDefaultBackend(backendSettings);
        this._expressMiddlewareProvider = expressMiddlewareProvider;
        this._expressMiddlewareSettings = expressMiddlewareSettings;
    }

    public async init() {
        await this._backend.startServer();
        this._logger.info(`Monitoring server started on port ${this._backend.getServerPort()}.`);
    }

    public getMonitoringMiddleware() {
        this._setupExpressMiddleware(this._expressMiddlewareProvider, this._expressMiddlewareSettings);

        return this._prometheusMiddleware;
    }

    public async destroy() {
        await this._backend.stopServer();
        this._logger.info("Monitoring server stopped.");
    }

    public getServerPort() {
        const port = this._backend.getServerPort();

        return port;
    }

    public getClient() {
        return this._backend.getClient();
    }

    private _setupExpressMiddleware(expressMiddlewareProvider: any, expressMiddlewareSettings: any) {
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

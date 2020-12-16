import { RequestHandler } from "express";
import promBundle from "express-prom-bundle";
import { ILogger } from "nchat-dev-common";

import { PrometheusMetricsBackend } from "./backends/prometheus";

import { ExpressMiddlewareDefaultSettings, DefaultBackendSettings } from "./constants";
import { ExpressMiddlewareProvider, IBackendSettings, IExpressMiddlewareSettings, IMetrics, IMetricsBackend, IMetricsOptions, IPromClient } from "./types";

export class Metrics implements IMetrics {
    private logger: ILogger;
    private backend: IMetricsBackend;
    private expressMiddlewareProvider?: ExpressMiddlewareProvider;
    private expressMiddlewareSettings?: IExpressMiddlewareSettings;
    private prometheusMiddleware?: RequestHandler;

    constructor({
        logger,
        backend,
        backendSettings,
        expressMiddlewareProvider,
        expressMiddlewareSettings,
    }: Partial<IMetricsOptions> = {}) {
        this.logger = logger || { ...console, child: () => this.logger };

        this.backend = backend || this.getDefaultBackend(backendSettings || {});
        this.expressMiddlewareProvider = expressMiddlewareProvider;
        this.expressMiddlewareSettings = expressMiddlewareSettings;
    }

    public async init(): Promise<void> {
        await this.backend.startServer();
        this.logger.info(`Monitoring server started on port ${this.backend.getServerPort()}.`);
    }

    public getMonitoringMiddleware(): RequestHandler {
        this.setupExpressMiddleware(this.expressMiddlewareProvider, this.expressMiddlewareSettings);

        if (!this.prometheusMiddleware) {
            throw new Error("Prometheus middleware is not initialized.");
        }

        return this.prometheusMiddleware;
    }

    public async destroy(): Promise<void> {
        await this.backend.stopServer();
        this.logger.info("Monitoring server stopped.");
    }

    public getServerPort(): number {
        const port = this.backend.getServerPort();

        return port;
    }

    public getClient(): IPromClient {
        return this.backend.getClient();
    }

    private setupExpressMiddleware(expressMiddlewareProvider: ExpressMiddlewareProvider | undefined, expressMiddlewareSettings: IExpressMiddlewareSettings | undefined): void {
        if (!this.prometheusMiddleware) {
            const metricsRegister = this.backend.getClient().register;

            if (!expressMiddlewareProvider) {
                // Use the Kinvey registry for the metrics in the middleware.
                (promBundle as any).promClient.register = metricsRegister;
            }

            const settings = { ...ExpressMiddlewareDefaultSettings, ...expressMiddlewareSettings };

            const provider = expressMiddlewareProvider ? expressMiddlewareProvider(metricsRegister) : promBundle;

            this.prometheusMiddleware = provider(settings);
        }
    }

    private getDefaultBackend(backendSettings: Partial<IBackendSettings>): IMetricsBackend {
        const settings = {
            logger: this.logger,
            ...DefaultBackendSettings,
            ...backendSettings,
        };
        const backend = new PrometheusMetricsBackend(settings);

        return backend;
    }
}

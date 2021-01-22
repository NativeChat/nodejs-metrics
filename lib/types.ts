import { RequestHandler } from "express";
import { Opts } from "express-prom-bundle/types";
import { ILogger } from "nchat-dev-common";
import client, { Registry } from "prom-client";

export interface IBackendSettings {
    defaultMetricsTimeout: number;
    serverPort: number;
    logger: ILogger;
}

export interface IDictionary<T> {
    [key: string]: T;
}

export interface IHistogramOptions extends ICounterOptions {
    buckets: number[];
}

export interface ICounterOptions {
    name: string;
    labelNames: string[];
    help: string;
}

export interface IGaugeOptions {
    name: string;
    labelNames: string[];
    help: string;
}

export interface ICollectMetricsOptions {
    client: IMetricsClient;
}

export interface ICreateMetricOptions extends ICollectMetricsOptions {
    name: string;
    labels: string[];
    help: string;
}

export type labelValues = IDictionary<string | number>;

export interface IHistogram {
    startTimer(labels?: labelValues): (labels?: labelValues) => void;
}

export interface ICounter {
    inc(labels: labelValues, value?: number, timestamp?: number | Date): void;
    inc(value?: number, timestamp?: number | Date): void;
}

export interface IGauge {
    set(labels: labelValues, value: number, timestamp?: number | Date): void;
    set(value: number, timestamp?: number | Date): void;
    inc(labels: labelValues, value?: number, timestamp?: number | Date): void;
    inc(value?: number, timestamp?: number | Date): void;
    dec(labels: labelValues, value?: number, timestamp?: number | Date): void;
    dec(value?: number, timestamp?: number | Date): void;
}

export type HistogramConstructor = new (options: IHistogramOptions) => IHistogram;

export type CounterConstructor = new (options: ICounterOptions) => ICounter;

export type GaugeConstructor = new (options: IGaugeOptions) => IGauge;

export interface IMetricsClient {
    Histogram: HistogramConstructor;
    Counter: CounterConstructor;
    Gauge: GaugeConstructor;
}

export interface IHistogramActionComposition<T> {
    action: () => Promise<T>;
    handleResult?: (err: any | null, labels: IDictionary<string>, result?: T) => void;
}

export interface ILabelsComposition {
    labels: IDictionary<string>;
}

export interface ITrackHistogramDurationOptions<T> extends IIncrementCounterOptions, IHistogramActionComposition<T> {
}

export interface IMetricNameComposition {
    metricName: string;
}

export interface IIncrementCounterOptions extends ILabelsComposition, IMetricNameComposition {
    count?: number;
}

export interface ISetGaugeOptions extends ILabelsComposition, IMetricNameComposition {
    count: number;
}

export interface IIncrementDecrementGaugeOptions extends ILabelsComposition, IMetricNameComposition {
    count?: number;
}

export type IMetric = ICounter | IHistogram | IGauge;

export type IMetricsDictionary = IDictionary<IMetric>;

export interface IMetrics {
    init(): Promise<void>;
    destroy(): Promise<void>;
    getMonitoringMiddleware(): RequestHandler;
    getServerPort(): number;
    getClient(): IPromClient;
}

export interface IMetricsTracker {
    trackHistogramDuration<T>(options: ITrackHistogramDurationOptions<T>): Promise<T>;
    incrementCounter(options: IIncrementCounterOptions): void;
    incrementGauge(options: IIncrementDecrementGaugeOptions): void;
    decrementGauge(options: IIncrementDecrementGaugeOptions): void;
    setGauge(options: ISetGaugeOptions): void;
    metrics?: IMetricsDictionary;
}

export interface IMetricsOptions {
    logger: ILogger;
    backend: IMetricsBackend;
    backendSettings: IBackendSettings;
    expressMiddlewareProvider: ExpressMiddlewareProvider;
    expressMiddlewareSettings: IExpressMiddlewareSettings;
}

export interface IMetricsBackend {
    getClient(): IPromClient;
    getServerPort(): number;
    startServer(): Promise<void>;
    stopServer(): Promise<void>;
}

export type IPromClient = typeof client;

export interface IMetricsTrackerOptions {
    metrics?: IMetricsDictionary;
}

export type IExpressMiddlewareSettings = Opts;
export type RequestHandlerProvider = (settings: IExpressMiddlewareSettings) => RequestHandler;
export type ExpressMiddlewareProvider = (registry: Registry) => RequestHandlerProvider;

export interface IExternalServiceMetricsTrackingOptions<T> extends IHistogramActionComposition<T> {
    targetLabel: string;
}

export interface IExternalServiceMetricsTracker {
    trackHistogramDuration<T>(options: IExternalServiceMetricsTrackingOptions<T>): Promise<T>;
}

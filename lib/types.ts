import { ILogger } from "nchat-dev-common";

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

export type HistogramConstructor = new (options: IHistogramOptions) => IHistogram;

export type CounterConstructor = new (options: ICounterOptions) => ICounter;

export interface IMetricsClient {
    Histogram: HistogramConstructor;
    Counter: CounterConstructor;
}

export interface ITrackHistogramDurationOptions<T> extends IIncrementCounterOptions {
    action: () => Promise<T>;
    handleResult?: (result: T, labels: IDictionary<string>) => void;
}

export interface IIncrementCounterOptions {
    metricName: string;
    labels: IDictionary<string>;
}

export type IMetric = ICounter | IHistogram;

export type IMetrics = IDictionary<IMetric>;

export interface IMetricsTracker {
    trackHistogramDuration<T>(options: ITrackHistogramDurationOptions<T>): Promise<T>;
    incrementCounter(options: IIncrementCounterOptions): void;
    metrics?: IMetrics;
}

export interface IMetricsOptions {
    logger: ILogger;
    backend: any;
    backendSettings: IBackendSettings;
    expressMiddlewareProvider: any;
    expressMiddlewareSettings: any;
}

export interface IMetricsBackend {
    getClient(): any;
    getServerPort(): number;
    startServer(): Promise<void>;
    stopServer(): Promise<void>;
}

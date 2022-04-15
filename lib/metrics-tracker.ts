import { ICounter, IGauge, IHistogram, IIncrementCounterOptions, IIncrementDecrementGaugeOptions, IMetricsDictionary, IMetricsTracker, IMetricsTrackerOptions, ISetGaugeOptions, ITrackHistogramDurationOptions } from "./types";

export class MetricsTracker implements IMetricsTracker {
    public metrics?: IMetricsDictionary;
    constructor({ metrics }: IMetricsTrackerOptions) {
        this.metrics = metrics;
    }

    public async trackHistogramDuration<T>({ metricName, labels, action, handleResult }: ITrackHistogramDurationOptions<T>) {
        if (!action) {
            throw new Error("The action parameter is required");
        }

        if (!this.metrics) {
            return action();
        }

        this.verifyMetric(metricName);

        // eslint-disable-next-line no-param-reassign
        labels = labels || {};

        const metric = this.metrics[metricName] as IHistogram;
        const timer = metric.startTimer(labels);

        try {
            const result = await action();
            if (handleResult) {
                handleResult(null, labels, result);
            }

            timer();

            return result;
        } catch (err) {
            if (handleResult) {
                handleResult(err, labels);
            }

            timer();

            throw err;
        }
    }

    public incrementCounter({ count, metricName, labels }: IIncrementCounterOptions) {
        if (!this.metrics) {
            return;
        }

        this.verifyMetric(metricName);

        const metric = this.metrics[metricName] as ICounter;
        metric.inc(labels, count);
    }

    public incrementGauge({ count, metricName, labels }: IIncrementDecrementGaugeOptions) {
        if (!this.metrics) {
            return;
        }

        this.verifyMetric(metricName);

        const metric = this.metrics[metricName] as IGauge;
        metric.inc(labels, count);
    }

    public decrementGauge({ count, metricName, labels }: IIncrementDecrementGaugeOptions) {
        if (!this.metrics) {
            return;
        }

        this.verifyMetric(metricName);

        const metric = this.metrics[metricName] as IGauge;
        metric.dec(labels, count);
    }

    public setGauge({ count, metricName, labels }: ISetGaugeOptions) {
        if (!this.metrics) {
            return;
        }

        this.verifyMetric(metricName);

        const metric = this.metrics[metricName] as IGauge;
        metric.set(labels, count);
    }

    private verifyMetric(metricName: string) {
        if (!this.metrics || !this.metrics[metricName]) {
            throw new Error(`Metric with name ${metricName} is not registered in the metrics tracker`);
        }
    }
}

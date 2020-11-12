import { Labels } from "./constants";
import { ICounter, IHistogram, IIncrementCounterOptions, IMetricsDictionary, IMetricsTracker, IMetricsTrackerOptions, ITrackHistogramDurationOptions } from "./types";

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

        // tslint:disable-next-line: no-parameter-reassignment
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

    private verifyMetric(metricName: string) {
        if (!this.metrics || !this.metrics[metricName]) {
            throw new Error(`Metric with name ${metricName} is not registered in the metrics tracker`);
        }
    }
}

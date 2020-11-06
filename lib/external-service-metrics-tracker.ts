import { ExternalServiceMetricConstants } from "./constants";
import { MetricsTracker } from "./metrics-tracker";
import { IDictionary, IMetricsClient, ITrackHistogramDurationOptions } from "./types";

export class ExternalServiceMetricsTracker {
    private _metricsTracker: MetricsTracker;

    constructor({ promClient }: { promClient: IMetricsClient }) {
        if (!promClient) {
            throw new Error("promClient argument is mandatory.");
        }

        const externalServiceLabels = Object.values(ExternalServiceMetricConstants.Labels);
        const metrics = {
            [ExternalServiceMetricConstants.Name]: new promClient.Histogram({
                name: ExternalServiceMetricConstants.Name,
                help: `duration histogram of external service calls labeled with: ${externalServiceLabels.join(", ")}`,
                labelNames: externalServiceLabels,
                buckets: ExternalServiceMetricConstants.HistogramValues.Bucket,
            }),
        };

        this._metricsTracker = new MetricsTracker({ metrics });
    }

    public async trackHistogramDuration<T>({
        targetLabel,
        action,
        handleResult,
    }: {
        targetLabel: string;
        action: () => Promise<T>;
        handleResult?: (result: T, labels: IDictionary<string>) => void;
    }) {
        return await this._metricsTracker.trackHistogramDuration({
            metricName: ExternalServiceMetricConstants.Name,
            labels: {
                [ExternalServiceMetricConstants.Labels.Target]: targetLabel,
            },
            action,
            handleResult,
        });
    }
}

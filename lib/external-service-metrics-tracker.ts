import { ExternalServiceMetricConstants } from "./constants";
import { MetricsTracker } from "./metrics-tracker";
import { IExternalServiceMetricsTrackingOptions, IExternalServiceMetricsTracker, IMetricsClient } from "./types";

export class ExternalServiceMetricsTracker implements IExternalServiceMetricsTracker {
    private metricsTracker: MetricsTracker;

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

        this.metricsTracker = new MetricsTracker({ metrics });
    }

    public async trackHistogramDuration<T>({
        targetLabel,
        action,
        handleResult,
    }: IExternalServiceMetricsTrackingOptions<T>) {
        return await this.metricsTracker.trackHistogramDuration({
            metricName: ExternalServiceMetricConstants.Name,
            labels: {
                [ExternalServiceMetricConstants.Labels.Target]: targetLabel,
            },
            action,
            handleResult,
        });
    }
}

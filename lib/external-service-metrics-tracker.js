'use strict';

const { ExternalServiceMetricConstants } = require('./constants');
const { MetricsTracker } = require('./metrics-tracker');

class ExternalServiceMetricsTracker {
    constructor({ promClient }) {
        if (!promClient) {
            throw new Error('promClient argument is mandatory.');
        }

        const externalServiceLabels = Object.values(ExternalServiceMetricConstants.Labels);
        const metrics = {
            [ExternalServiceMetricConstants.Name]: new promClient.Histogram({
                name: ExternalServiceMetricConstants.Name,
                help: `duration histogram of external service calls labeled with: ${externalServiceLabels.join(', ')}`,
                labelNames: externalServiceLabels,
                buckets: ExternalServiceMetricConstants.HistogramValues.Bucket
            }),
        };

        this._metricsTracker = new MetricsTracker({ metrics });
    }

    trackHistogramDuration({ targetLabel, action, handleResult }) {
        return this._metricsTracker.trackHistogramDuration({
            metricName: ExternalServiceMetricConstants.Name,
            labels: {
                [ExternalServiceMetricConstants.Labels.Target]: targetLabel
            },
            action,
            handleResult
        });
    }
}

module.exports = { ExternalServiceMetricsTracker };

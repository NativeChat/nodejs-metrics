'use strict';

const { ExternalServiceConstants } = require('./constants');
const { MetricsTracker } = require('./metrics-tracker');

class DefaultExternalServiceMetricsTracker {
    constructor({ promClient }) {
        if (!promClient) {
            throw new Error('promClient argument is mandatory.');
        }

        const externalServiceLabels = Object.values(ExternalServiceConstants.Labels);
        const metrics = {
            [ExternalServiceConstants.Name]: new promClient.Histogram({
                name: ExternalServiceConstants.Name,
                help: `duration histogram of external service calls labeled with: ${externalServiceLabels.join(', ')}`,
                labelNames: externalServiceLabels,
                buckets: ExternalServiceConstants.HistogramValues.Bucket
            }),
        };

        this.metricsTracker = new MetricsTracker({ metrics });
    }

    trackHistogramDuration({ targetLabel, action, handleResult }) {
        return this.metricsTracker.trackHistogramDuration({
            metricName: ExternalServiceConstants.Name,
            labels: {
                [ExternalServiceConstants.Labels.Target]: targetLabel
            },
            action,
            handleResult
        });
    }
}

module.exports = { DefaultExternalServiceMetricsTracker };

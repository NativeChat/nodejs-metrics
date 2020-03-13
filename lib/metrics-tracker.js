'use strict';

const { Labels } = require('./constants');

class MetricsTracker {
    constructor({ metrics }) {
        this.metrics = metrics;
    }

    async trackHistogramDuration({ metricName, labels, action, handleResult }) {
        if (!action) {
            throw new Error('The action parameter is required');
        }

        if (!this.metrics) {
            return action();
        }

        this._verifyMetric(metricName);

        labels = labels || {};
        const timer = this.metrics[metricName].startTimer(labels);

        try {
            const result = await action();
            if (handleResult) {
                handleResult(result, labels);
            }

            timer();

            return result;
        } catch (err) {
            labels[Labels.Error] = err.name || err.type || err.code;
            timer();

            throw err;
        }
    }

    incrementCounter({ metricName, labels }) {
        if (!this.metrics) {
            return;
        }

        this._verifyMetric(metricName);

        this.metrics[metricName].inc(labels);
    }

    _verifyMetric(metricName) {
        if (!this.metrics[metricName]) {
            throw new Error(`Metric with name ${metricName} is not registered in the metrics tracker`);
        }
    }
}

module.exports = { MetricsTracker };

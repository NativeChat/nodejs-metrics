'use strict';

const { Labels } = require('./constants');

class MetricsTracker {
    constructor({ metrics }) {
        this.metrics = metrics;
    }

    async trackHistogramDuration({ metricName, labels, action, handleResult }) {
        if (!this.metrics) {
            return action();
        }

        const timer = this.metrics[metricName].startTimer(labels);

        try {
            const result = await action();
            if (handleResult) {
                handleResult(result, labels);
            }

            timer();

            return result;
        } catch (err) {
            labels[Labels.Error] = err.name || err.code;
            timer();

            throw err;
        }
    }

    incrementCounter({ metricName, labels }) {
        if (!this.metrics) {
            return;
        }

        this.metrics[metricName].inc(labels);
    }
}

module.exports = { MetricsTracker };

'use strict';

const http = require('http');
const { DefaultMetricsServerPort } = require('../constants');

const httpGet = async (url) => {
    const metricsResult = await new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let result = '';
            res.on('data', (data) => {
                result += data.toString();
            });
            res.on('end', () => resolve(result));
            res.on('error', reject);
        });
    });

    return metricsResult;
};

const verifyMetricsResponse = async (expectedMetrics, port = DefaultMetricsServerPort) => {
    const metricsResponse = await httpGet(`http://localhost:${port}/metrics`);

    expectedMetrics.forEach((expectedMetric) => {
        expect(metricsResponse).toContain(expectedMetric);
    });
};

module.exports = { httpGet, verifyMetricsResponse };

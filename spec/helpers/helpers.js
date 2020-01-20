'use strict';

const http = require('http');

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

const verifyMetricsResponse = async (expectedMetrics) => {
  const metricsResponse = await httpGet('http://localhost:39110/metrics');

  expectedMetrics.forEach((expectedMetric) => {
    expect(metricsResponse).toContain(expectedMetric);
  });
};

module.exports = { httpGet, verifyMetricsResponse };

'use strict';

const express = require('express');

const { httpGet, verifyMetricsResponse } = require('../helpers/helpers');

const { Metrics } = require('../../index');

describe('Metrics', () => {
    const metrics = new Metrics();

    beforeAll(async () => {
        await metrics.init();
    });

    afterAll(async () => {
        await metrics.destroy();
    });

    describe('Server', () => {
        it('should return default nodejs and http metrics.', async () => {
            const expectedMetrics = [
                '# TYPE process_cpu_user_seconds_total counter',
                '# TYPE process_cpu_system_seconds_total counter',
                '# TYPE process_cpu_seconds_total counter',
                '# TYPE process_start_time_seconds gauge',
                '# TYPE process_resident_memory_bytes gauge',
                '# TYPE nodejs_eventloop_lag_seconds gauge',
                '# TYPE nodejs_active_handles_total gauge',
                '# TYPE nodejs_active_requests_total gauge',
                '# TYPE nodejs_heap_size_total_bytes gauge',
                '# TYPE nodejs_heap_size_used_bytes gauge',
                '# TYPE nodejs_external_memory_bytes gauge',
                '# TYPE nodejs_heap_space_size_total_bytes gauge',
                '# TYPE nodejs_heap_space_size_used_bytes gauge',
                '# TYPE nodejs_heap_space_size_available_bytes gauge',
                '# TYPE nodejs_version_info gauge',
                '# TYPE http_request_duration_seconds histogram'
            ];

            await verifyMetricsResponse(expectedMetrics);
        });

        it('should return express req/res metrics.', async () => {
            const paramPath = '/v1/:someParam';
            const staticPath = '/v1/static';
            const port = 55555;
            const appServerUrl = `http://localhost:${port}`;

            await new Promise((resolve) => {
                const app = express();

                app.use(metrics.getMonitoringMiddleware());

                app.get(staticPath, (req, res) => res.sendStatus(200));
                app.get(paramPath, (req, res) => res.sendStatus(200));

                app.listen(port, resolve);
            });

            await httpGet(`${appServerUrl}/v1/test`);
            await httpGet(`${appServerUrl}/v1/static`);
            await httpGet(`${appServerUrl}/v1/not/found`);


            const expectedMetrics = [
                `http_request_duration_seconds_bucket{le="+Inf",status_code="200",method="GET",path="${paramPath}"} 1`,
                `http_request_duration_seconds_bucket{le="+Inf",status_code="200",method="GET",path="${staticPath}"} 1`,
                'http_request_duration_seconds_count{status_code="404",method="GET",path="/__notFound__"} 1'
            ];

            await verifyMetricsResponse(expectedMetrics);
        });
    });
});

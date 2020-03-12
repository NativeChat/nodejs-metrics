'use strict';

const { verifyMetricsResponse } = require('../helpers/helpers');

const { DefaultExternalServiceMetricsTracker, Metrics } = require('../../index');

describe('DefaultExternalServiceMetricsTracker', () => {
    let metrics;

    beforeEach(async () => {
        metrics = new Metrics();
        await metrics.init();
    });

    afterEach(async () => {
        await metrics.destroy();
    });

    it('should return error if no promClient is passed.', () => {
        expect(() => { new DefaultExternalServiceMetricsTracker({}); }).toThrowError('promClient argument is mandatory.');
    });

    it('should throw if instantiated multiple times with the same promClient.', () => {
        const promClient = metrics.getClient();
        new DefaultExternalServiceMetricsTracker({ promClient });
        expect(() => { new DefaultExternalServiceMetricsTracker({ promClient }); }).toThrowError('A metric with the name external_service_request_duration_seconds has already been registered.');
    });

    it('returned tracker should track histogram metrics.', async () => {
        const promClient = metrics.getClient();
        const tracker = new DefaultExternalServiceMetricsTracker({ promClient });

        const baseOptions = {
            targetLabel: 'test_label'
        };

        await tracker.trackHistogramDuration(Object.assign(baseOptions, { action: async () => { } }));

        await expectAsync(tracker.trackHistogramDuration(Object.assign(baseOptions, {
            action: async () => {
                const err = new Error();
                err.name = 'TestErr';

                throw err;
            }
        }))).toBeRejected();

        await verifyMetricsResponse([
            '# HELP external_service_request_duration_seconds duration histogram of external service calls labeled with: target, error',
            '# TYPE external_service_request_duration_seconds histogram',
            'external_service_request_duration_seconds_bucket{le="0.1",target="test_label"} 1',
            'external_service_request_duration_seconds_bucket{le="0.3",target="test_label"} 1',
            'external_service_request_duration_seconds_bucket{le="1.5",target="test_label"} 1',
            'external_service_request_duration_seconds_bucket{le="5",target="test_label"} 1',
            'external_service_request_duration_seconds_bucket{le="10",target="test_label"} 1',
            'external_service_request_duration_seconds_bucket{le="15",target="test_label"} 1',
            'external_service_request_duration_seconds_bucket{le="20",target="test_label"} 1',
            'external_service_request_duration_seconds_bucket{le="30",target="test_label"} 1',
            'external_service_request_duration_seconds_bucket{le="+Inf",target="test_label"} 1',
            'external_service_request_duration_seconds_sum{target="test_label"}',
            'external_service_request_duration_seconds_count{target="test_label"} 1',
            'external_service_request_duration_seconds_bucket{le="0.1",target="test_label",error="TestErr"} 1',
            'external_service_request_duration_seconds_bucket{le="0.3",target="test_label",error="TestErr"} 1',
            'external_service_request_duration_seconds_bucket{le="1.5",target="test_label",error="TestErr"} 1',
            'external_service_request_duration_seconds_bucket{le="5",target="test_label",error="TestErr"} 1',
            'external_service_request_duration_seconds_bucket{le="10",target="test_label",error="TestErr"} 1',
            'external_service_request_duration_seconds_bucket{le="15",target="test_label",error="TestErr"} 1',
            'external_service_request_duration_seconds_bucket{le="20",target="test_label",error="TestErr"} 1',
            'external_service_request_duration_seconds_bucket{le="30",target="test_label",error="TestErr"} 1',
            'external_service_request_duration_seconds_bucket{le="+Inf",target="test_label",error="TestErr"} 1',
            'external_service_request_duration_seconds_sum{target="test_label",error="TestErr"}',
            'external_service_request_duration_seconds_count{target="test_label",error="TestErr"} 1'
        ]);
    });
});

'use strict';

const { verifyMetricsResponse } = require('../helpers/helpers');

const { Metrics, MetricsTracker } = require('../../index');

const DefaultMetricsServerPort = 39110;

describe('MetricsTracker', () => {
    let metrics;

    beforeEach(async () => {
        metrics = new Metrics();
        await metrics.init();
    });

    afterEach(async () => {
        await metrics.destroy();
    });

    describe('trackHistogramDuration', () => {
        it('should track histogram metrics.', async () => {
            const client = metrics.getClient();
            const tracker = new MetricsTracker({
                metrics: {
                    'test': new (client.Histogram)({
                        name: 'test',
                        help: 'some help',
                        labelNames: ['foo']
                    })
                }
            });

            const baseOptions = {
                metricName: 'test',
                labels: { 'foo': 'bar' },
                action: async () => { }
            };

            await tracker.trackHistogramDuration(Object.assign(baseOptions, { action: async () => { } }));

            expectAsync(tracker.trackHistogramDuration(Object.assign(baseOptions, {
                action: async () => {
                    const err = new Error();
                    err.name = 'TestErr';

                    throw err;
                }
            }))).toBeRejected();

            await verifyMetricsResponse([
                '# HELP test some help',
                '# TYPE test histogram',
                'test_bucket{le="0.005",foo="bar"} 1',
                'test_bucket{le="0.01",foo="bar"} 1',
                'test_bucket{le="0.025",foo="bar"} 1',
                'test_bucket{le="0.05",foo="bar"} 1',
                'test_bucket{le="0.1",foo="bar"} 1',
                'test_bucket{le="0.25",foo="bar"} 1',
                'test_bucket{le="0.5",foo="bar"} 1',
                'test_bucket{le="1",foo="bar"} 1',
                'test_bucket{le="2.5",foo="bar"} 1',
                'test_bucket{le="5",foo="bar"} 1',
                'test_bucket{le="10",foo="bar"} 1',
                'test_bucket{le="+Inf",foo="bar"} 1',
                'test_sum{foo="bar"}',
                'test_count{foo="bar"} 1'
            ], DefaultMetricsServerPort);
        });


        it('should track counter metrics.', async () => {
            const client = metrics.getClient();
            const tracker = new MetricsTracker({
                metrics: {
                    'test': new (client.Counter)({
                        name: 'test',
                        help: 'some help',
                        labelNames: ['foo']
                    })
                }
            });

            await tracker.incrementCounter({
                metricName: 'test',
                labels: { 'foo': 'bar' }
            });

            await verifyMetricsResponse([
                '# HELP test some help',
                '# TYPE test counter',
                'test{foo="bar"} 1'
            ], DefaultMetricsServerPort);
        });
    });
});

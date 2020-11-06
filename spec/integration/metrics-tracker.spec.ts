"use strict";

import { verifyMetricsResponse } from "../helpers/helpers";

import { Metrics, MetricsTracker } from "../../index";

describe("MetricsTracker", () => {
    let metrics: Metrics;

    beforeEach(async () => {
        metrics = new Metrics();
        await metrics.init();
    });

    afterEach(async () => {
        await metrics.destroy();
    });

    describe("trackHistogramDuration", () => {
        it("should track histogram metrics.", async () => {
            const client = metrics.getClient();
            const tracker = new MetricsTracker({
                metrics: {
                    test: new (client.Histogram)({
                        name: "test",
                        help: "some help",
                        labelNames: ["foo", "error"],
                    }),
                },
            });

            const baseOptions = {
                metricName: "test",
                labels: { "foo": "bar" },
            };

            // tslint:disable-next-line: no-empty
            await tracker.trackHistogramDuration(Object.assign(baseOptions, { action: () => { } }) as any);

            await expectAsync(tracker.trackHistogramDuration(Object.assign(baseOptions, {
                action: () => {
                    const err = new Error();
                    err.name = "TestErr";

                    throw err;
                },
            }) as any)).toBeRejected();

            await verifyMetricsResponse([
                "# HELP test some help",
                "# TYPE test histogram",
                "test_bucket{le=\"0.005\",foo=\"bar\"} 1",
                "test_bucket{le=\"0.01\",foo=\"bar\"} 1",
                "test_bucket{le=\"0.025\",foo=\"bar\"} 1",
                "test_bucket{le=\"0.05\",foo=\"bar\"} 1",
                "test_bucket{le=\"0.1\",foo=\"bar\"} 1",
                "test_bucket{le=\"0.25\",foo=\"bar\"} 1",
                "test_bucket{le=\"0.5\",foo=\"bar\"} 1",
                "test_bucket{le=\"1\",foo=\"bar\"} 1",
                "test_bucket{le=\"2.5\",foo=\"bar\"} 1",
                "test_bucket{le=\"5\",foo=\"bar\"} 1",
                "test_bucket{le=\"10\",foo=\"bar\"} 1",
                "test_bucket{le=\"+Inf\",foo=\"bar\"} 1",
                "test_sum{foo=\"bar\"}",
                "test_count{foo=\"bar\"} 1",
                "test_bucket{le=\"0.005\",foo=\"bar\",error=\"TestErr\"} 1",
                "test_bucket{le=\"0.01\",foo=\"bar\",error=\"TestErr\"} 1",
                "test_bucket{le=\"0.025\",foo=\"bar\",error=\"TestErr\"} 1",
                "test_bucket{le=\"0.05\",foo=\"bar\",error=\"TestErr\"} 1",
                "test_bucket{le=\"0.1\",foo=\"bar\",error=\"TestErr\"} 1",
                "test_bucket{le=\"0.25\",foo=\"bar\",error=\"TestErr\"} 1",
                "test_bucket{le=\"0.5\",foo=\"bar\",error=\"TestErr\"} 1",
                "test_bucket{le=\"1\",foo=\"bar\",error=\"TestErr\"} 1",
                "test_bucket{le=\"2.5\",foo=\"bar\",error=\"TestErr\"} 1",
                "test_bucket{le=\"5\",foo=\"bar\",error=\"TestErr\"} 1",
                "test_bucket{le=\"10\",foo=\"bar\",error=\"TestErr\"} 1",
                "test_bucket{le=\"+Inf\",foo=\"bar\",error=\"TestErr\"} 1",
                "test_sum{foo=\"bar\",error=\"TestErr\"}",
                "test_count{foo=\"bar\",error=\"TestErr\"} 1",
            ]);
        });

        it("should track counter metrics.", async () => {
            const client = metrics.getClient();
            const tracker = new MetricsTracker({
                metrics: {
                    test: new (client.Counter)({
                        name: "test",
                        help: "some help",
                        labelNames: ["foo"],
                    }),
                },
            });

            tracker.incrementCounter({
                metricName: "test",
                labels: { "foo": "bar" },
            });

            await verifyMetricsResponse([
                "# HELP test some help",
                "# TYPE test counter",
                "test{foo=\"bar\"} 1",
            ]);
        });
    });
});

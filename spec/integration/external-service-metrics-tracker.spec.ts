import { verifyMetricsResponse } from "../helpers/helpers";

import { ExternalServiceMetricsTracker, IDictionary, Metrics } from "../../index";

describe("ExternalServiceMetricsTracker", () => {
    let metrics: Metrics;

    beforeEach(async () => {
        metrics = new Metrics();
        await metrics.init();
    });

    afterEach(async () => {
        await metrics.destroy();
    });

    it("should throw error if no promClient is passed.", () => {
        // tslint:disable-next-line: no-unused-expression
        expect(() => { new ExternalServiceMetricsTracker({} as any); }).toThrowError("promClient argument is mandatory.");
    });

    it("should throw if instantiated multiple times with the same promClient.", () => {
        const promClient = metrics.getClient();
        // tslint:disable-next-line: no-unused-expression
        new ExternalServiceMetricsTracker({ promClient });
        // tslint:disable-next-line: no-unused-expression
        expect(() => { new ExternalServiceMetricsTracker({ promClient }); }).toThrowError("A metric with the name external_service_request_duration_seconds has already been registered.");
    });

    it("returned tracker should track histogram metrics.", async () => {
        const promClient = metrics.getClient();
        const tracker = new ExternalServiceMetricsTracker({ promClient });

        const baseOptions = {
            targetLabel: "test_label",
        };

        // tslint:disable-next-line: no-empty
        await tracker.trackHistogramDuration(Object.assign(baseOptions, { action: () => { } }) as any);

        await expectAsync(tracker.trackHistogramDuration(Object.assign(baseOptions, {
            action: () => {
                const err = new Error();
                err.name = "TestErr";

                throw err;
            },
            handleResult: (error: Error, labels: IDictionary<string>) => {
                labels.error = error.name;
            },
        }) as any)).toBeRejected();

        await verifyMetricsResponse([
            "# HELP external_service_request_duration_seconds duration histogram of external service calls labeled with: target, error",
            "# TYPE external_service_request_duration_seconds histogram",
            "external_service_request_duration_seconds_bucket{le=\"0.1\",target=\"test_label\"} 1",
            "external_service_request_duration_seconds_bucket{le=\"0.3\",target=\"test_label\"} 1",
            "external_service_request_duration_seconds_bucket{le=\"1.5\",target=\"test_label\"} 1",
            "external_service_request_duration_seconds_bucket{le=\"5\",target=\"test_label\"} 1",
            "external_service_request_duration_seconds_bucket{le=\"10\",target=\"test_label\"} 1",
            "external_service_request_duration_seconds_bucket{le=\"15\",target=\"test_label\"} 1",
            "external_service_request_duration_seconds_bucket{le=\"20\",target=\"test_label\"} 1",
            "external_service_request_duration_seconds_bucket{le=\"30\",target=\"test_label\"} 1",
            "external_service_request_duration_seconds_bucket{le=\"+Inf\",target=\"test_label\"} 1",
            "external_service_request_duration_seconds_sum{target=\"test_label\"}",
            "external_service_request_duration_seconds_count{target=\"test_label\"} 1",
            "external_service_request_duration_seconds_bucket{le=\"0.1\",target=\"test_label\",error=\"TestErr\"} 1",
            "external_service_request_duration_seconds_bucket{le=\"0.3\",target=\"test_label\",error=\"TestErr\"} 1",
            "external_service_request_duration_seconds_bucket{le=\"1.5\",target=\"test_label\",error=\"TestErr\"} 1",
            "external_service_request_duration_seconds_bucket{le=\"5\",target=\"test_label\",error=\"TestErr\"} 1",
            "external_service_request_duration_seconds_bucket{le=\"10\",target=\"test_label\",error=\"TestErr\"} 1",
            "external_service_request_duration_seconds_bucket{le=\"15\",target=\"test_label\",error=\"TestErr\"} 1",
            "external_service_request_duration_seconds_bucket{le=\"20\",target=\"test_label\",error=\"TestErr\"} 1",
            "external_service_request_duration_seconds_bucket{le=\"30\",target=\"test_label\",error=\"TestErr\"} 1",
            "external_service_request_duration_seconds_bucket{le=\"+Inf\",target=\"test_label\",error=\"TestErr\"} 1",
            "external_service_request_duration_seconds_sum{target=\"test_label\",error=\"TestErr\"}",
            "external_service_request_duration_seconds_count{target=\"test_label\",error=\"TestErr\"} 1",
        ]);
    });
});

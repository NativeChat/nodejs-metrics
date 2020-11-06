import { IBackendSettings } from "./types";

export const ExpressMiddlewareDefaultSettings = {
    autoregister: false, // Don't add the /metrics endpoint to the public API.
    includeStatus: true,
    includeMethod: true,
    includePath: true,
    buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 20, 30],
    includeUp: false,
    normalizePath: (req: any) => {
        const path = req.route && req.route.path ? req.route.path : "/__notFound__";

        return path;
    },
};

export const DefaultBackendSettings: Partial<IBackendSettings> = {
    defaultMetricsTimeout: 5000,
    serverPort: 39110,
};

export const Labels = {
    Error: "error",
};

export const ExternalServiceMetricConstants = {
    Name: "external_service_request_duration_seconds",
    Labels: {
        Target: "target",
        Error: "error",
    },
    HistogramValues: {
        Bucket: [0.1, 0.3, 1.5, 5, 10, 15, 20, 30],
    },
};

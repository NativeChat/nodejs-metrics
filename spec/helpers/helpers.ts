import http from "http";
import { DefaultMetricsServerPort } from "../constants";

export const httpGet = async (url: string) => {
    const metricsResult = await new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let result = "";
            res.on("data", (data) => {
                result += data.toString();
            });
            res.on("end", () => resolve(result));
            res.on("error", reject);
        });
    });

    return metricsResult;
};

export const verifyMetricsResponse = async (expectedMetrics: string[], port = DefaultMetricsServerPort) => {
    const metricsResponse = await httpGet(`http://localhost:${port}/metrics`);

    expectedMetrics.forEach((expectedMetric) => {
        expect(metricsResponse).toContain(expectedMetric);
    });
};

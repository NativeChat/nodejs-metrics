import http from "http";
import { DefaultMetricsServerPort } from "../constants";

export const httpGet = async (url: string): Promise<string> => {
    const metricsResult: string = await new Promise((resolve, reject) => {
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

export const verifyMetricsResponse = async (expectedMetrics: string[], port = DefaultMetricsServerPort): Promise<void> => {
    const metricsResponse = await httpGet(`http://localhost:${port}/metrics`);

    expectedMetrics.forEach((expectedMetric) => {
        expect(metricsResponse).toContain(expectedMetric);
    });
};

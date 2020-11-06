"use strict";

import { Metrics } from "../../index";
import sinon from "sinon";

const getBackend = (register = {}) => {
    const backend = {
        startServer: sinon.usingPromise(null).spy(),
        stopServer: sinon.usingPromise(null).spy(),
        getClient: sinon.stub().returns({ register }),
        getServerPort: () => {/* No implementation required */ },
    };

    return backend;
};

const getExpressMiddlewareProvider = () => {
    // tslint:disable-next-line: no-empty
    const expressMiddlewareProvider = sinon.stub().returns(() => { });

    return expressMiddlewareProvider;
};

// tslint:disable-next-line: no-empty
const logger = { info: () => { } };

const getMetrics = (register = {}) => {
    const backend = getBackend(register);
    const expressMiddlewareProvider = getExpressMiddlewareProvider();
    const metrics = new Metrics({ logger, backend, expressMiddlewareProvider } as any);

    return { metrics, backend, expressMiddlewareProvider };
};

describe("Metrics", () => {
    describe("init", () => {
        it("should start the metrics server using the provided metrics backend.", async () => {
            const { backend, metrics } = getMetrics();

            await metrics.init();

            expect(backend.startServer.calledOnce).toBeTrue();
        });
    });

    describe("destroy", () => {
        it("should stop the metrics server using the provided metrics backend.", async () => {
            const { backend, metrics } = getMetrics();

            await metrics.destroy();

            expect(backend.stopServer.calledOnce).toBeTrue();
        });
    });

    describe("getMonitoringMiddleware", () => {
        it("should pass the register of the metrics backend to the express middleware provider.", () => {
            const expectedRegister = {};
            const { expressMiddlewareProvider, metrics } = getMetrics(expectedRegister);
            metrics.getMonitoringMiddleware();

            expect(expressMiddlewareProvider.calledOnceWithExactly(expectedRegister)).toBeTrue();
        });
    });
});

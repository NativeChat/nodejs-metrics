'use strict';

const { Metrics } = require('../../index');
const sinon = require('sinon');

const getBackend = (register = {}) => {
    const backend = {
        startServer: sinon.usingPromise().spy(),
        stopServer: sinon.usingPromise().spy(),
        getClient: sinon.stub().returns({ register })
    };

    return backend;
};

const getExpressMiddlewareProvider = () => {
    const expressMiddlewareProvider = sinon.stub().returns(() => { });

    return expressMiddlewareProvider;
};

const logger = { info: () => { } };

const getMetrics = (register = {}) => {
    const backend = getBackend(register);
    const expressMiddlewareProvider = getExpressMiddlewareProvider();
    const metrics = new Metrics({ logger, backend, expressMiddlewareProvider });

    return { metrics, backend, expressMiddlewareProvider };
};

describe('Metrics', () => {
    describe('init', () => {
        it('should start the metrics server using the provided metrics backend.', async () => {
            const { backend, metrics } = getMetrics();

            await metrics.init();

            expect(backend.startServer.calledOnce).toBeTrue();
        });
    });

    describe('destroy', () => {
        it('should stop the metrics server using the provided metrics backend.', async () => {
            const { backend, metrics } = getMetrics();

            await metrics.destroy();

            expect(backend.stopServer.calledOnce).toBeTrue();
        });
    });

    describe('getMonitoringMiddleware', () => {
        it('should pass the register of the metrics backend to the express middleware provider.', async () => {
            const expectedRegister = {};
            const { expressMiddlewareProvider, metrics } = getMetrics(expectedRegister);
            metrics.getMonitoringMiddleware();

            expect(expressMiddlewareProvider.calledOnceWithExactly(expectedRegister)).toBeTrue();
        });
    });
});

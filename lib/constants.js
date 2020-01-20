'use strict';

const ExpressMiddlewareDefaultSettings = {
  autoregister: false, // Don't add the /metrics endpoint to the public API.
  includeStatus: true,
  includeMethod: true,
  includePath: true,
  buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 20, 30],
  includeUp: false,
  normalizePath: (req) => {
    const path = req.route && req.route.path ? req.route.path : '/__notFound__';

    return path;
  }
};

module.exports = { ExpressMiddlewareDefaultSettings };

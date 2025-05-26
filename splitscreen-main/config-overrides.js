// config-overrides.js
const webpack = require('webpack');

module.exports = function override(config, env) {
  config.resolve.fallback = {
    buffer: require.resolve('buffer'),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    util: require.resolve('util'),
    path: require.resolve('path-browserify'),
    os: require.resolve('os-browserify/browser'),
    url: require.resolve('url'),
    querystring: require.resolve('querystring-es3'),
    https: require.resolve('https-browserify'),
    http: require.resolve('stream-http'),
    assert: require.resolve('assert'),
    zlib: require.resolve('browserify-zlib'),
    fs: false,
    net: false,
    tls: false,
    child_process: false,
    http2: false,  // Exclude http2 module
  };

  config.resolve.alias = {
    http2: false, // Exclude http2 module
  };

  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    })
  );

  return config;
};

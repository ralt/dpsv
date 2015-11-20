'use strict';

const Promise = require('bluebird');
const request = require('request-promise');

Promise.promisifyAll(request);

module.exports = function(url) {
    return request({ uri: url, encoding: null });
};

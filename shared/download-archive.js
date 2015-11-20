'use strict';

const log = require('util').log;
const f = require('util').format;

const Promise = require('bluebird');
const request = require('request-promise');

Promise.promisifyAll(request);

module.exports = function(url) {
    // httpredir.debian.org is fairly unreliable, so we retry 5 times.
    return function r(acc) {
        return request({ uri: url, encoding: null }).catch(function(err) {
            if (acc < 5) {
                log(f('Failed downloading %s, retrying (%d/%d)...', url, acc + 1, 5));
                return r(++acc);
            }
            throw err;
        });
    }(0);
};

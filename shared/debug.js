'use strict';

const log = require('util').log;

module.exports = function() {
    if (process.env.DEBUG) {
        log.apply(log, arguments);
    }
};

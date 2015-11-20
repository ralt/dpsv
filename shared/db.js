'use strict';

const Promise = require('bluebird');
const pg = require('pg');

const connObj = {
    user: 'dpsv',
    database: 'dpsv',
    password: 'password'
};

Promise.promisifyAll(pg, { multiArgs: true });
Promise.promisifyAll(pg.Client.prototype);

module.exports = function() {
    let close;
    return pg.connectAsync(connObj).spread(function(client, done) {
        close = done;
        return client;
    }).disposer(function() {
        if (close) close();
    });
};

'use strict';

const Promise = require('bluebird');
const pg = require('pg');

const database = JSON.parse(
    process.env.PLATFORM_RELATIONSHIPS ?
        new Buffer(process.env.PLATFORM_RELATIONSHIPS, 'base64').toString('ascii') :
        // Development settings
        JSON.stringify({
            database: [{
                username: 'dpsv',
                database: 'dpsv',
                password: 'password'
            }]
        })
).database[0];

const connObj = {
    user: database.username,
    database: database.database,
    password: database.password
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

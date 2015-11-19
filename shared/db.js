'use strict';

const Promise = require('bluebird');
const pg = require('pg');

const connObj = {
    user: 'dpsv',
    database: 'dpsv',
    password: 'password'
};

Promise.promisifyAll(pg.Client.prototype);

module.exports = function() {
    let close;
    return new Promise(function(resolve, reject) {
        pg.connect(connObj, function(err, client, done) {
            if (err) return reject(err);
            close = done;
            resolve(client);
        });
    }).disposer(function() {
        if (close) close();
    });
};

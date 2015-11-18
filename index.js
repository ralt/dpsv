'use strict';

const http = require('http');
const format = require('util').format;

const api = require('./api');
const frontend = require('./frontend');
const updater = require('./updater');
const deleter = require('./deleter');

if (/--update\b/.test(process.argv)) {
    updater();
}

if (/--delete\b/.test(process.argv)) {
    deleter();
}

if (/--http\b/.test(process.argv)) {
    http.createServer(httpServer).listen(process.env.PORT, function() {
        console.log(format('HTTP server listening on %d', process.env.PORT));
    });
}

function httpServer(req, res) {
    if (req.url.indexOf('/api/') === 0) {
        api(req, res);
    }
    else {
        frontend(req, res);
    }
}

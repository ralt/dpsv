'use strict';

const http = require('http');

const api = require('./api');
const frontend = require('./frontend');
const updater = require('./updater');
const deleter = require('./deleter');

if (process.env.argv.indexOf('--update') >= 0) {
    updater();
}

if (process.env.argv.indexOf('--delete') >= 0) {
    deleter();
}

if (process.env.argv.indexOf('--http') >= 0) {
    http.createServer(httpServer).listen(process.env.PORT);
}

function httpServer(req, res) {
    if (req.url.indexOf('/api/') === 0) {
        api(req, res);
    }
    else {
        frontend(req, res);
    }
}

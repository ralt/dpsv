'use strict';

const url = require('url');
const http = require('http');
const format = require('util').format;
const fs = require('fs');
const path = require('path');

const Promise = require('bluebird');

const db = require('../shared/db');

Promise.promisifyAll(fs);

const templatesDir = path.join(__dirname, '..', 'templates');

module.exports = function(req, res) {
    Promise.using(db(), function(client) {
        return client.queryAsync({
            name: 'get_maintenance_mode',
            text: 'select value from maintenance_mode',
            values: []
        }).get(0).get('rows').get(0).get('value').then(function(mode) {
            if (mode === 'on') {
                res.statusCode = 503;
                res.setHeader('Content-Type', 'text/plain');
                return res.end(maintenanceModeMessage());
            }

            res.setHeader('Content-Type', 'text/html');

            const path = url.parse(req.url);

            if (path.pathname === '/' || path.pathname.match(/^\/search\/?/)) {
                // One week cache
                return loadPage(res, 'search', 604800);
            }

            if (path.pathname.split('/')[1] === 'packages') {
                // 24-hours cache
                return loadPage(res, 'packages', 86400);
            }

            res.statusCode = 404;
            return res.end(http.STATUS_CODES[404]);
        });
    });
};

function maintenanceModeMessage() {
    return [
        "I am currently in maintenance mode.",
        "This means that I am updating my local index of Debian sources.",
        "This usually takes less than 10 minutes, so please come back a bit later, I should be fine by then.",
        "Have a nice day!"
    ].join('\n\n');
}

function setCacheDuration(res, duration) {
    res.setHeader('Cache-Control', format('public, max-age=%d', duration));
}

function loadPage(res, page, cacheDuration) {
    setCacheDuration(res, cacheDuration);

    fs.readFileAsync(path.join(templatesDir, format('%s.html', page)), 'utf-8')
        .then(res.end.bind(res)).done();
}

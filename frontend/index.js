'use strict';

const url = require('url');
const http = require('http');
const format = require('util').format;
const fs = require('fs');
const path = require('path');

const Promise = require('bluebird');

Promise.promisifyAll(fs);

const templatesDir = path.join(__dirname, '..', 'templates');

module.exports = function(req, res) {
    const path = url.parse(req.url);

    if (path.pathname === '/' || path.pathname.match(/^\/search\/?/)) {
        // One week cache
        return loadPage(res, 'search', 604800);
    }

    if (path.pathname.split('/')[1] === 'packages') {
        // 24-hours cache
        return loadPage(res, 'packages', 86400);
    }

    return pageNotFound(res);
};

function pageNotFound(res) {
    res.statusCode = 404;
    return res.end(http.STATUS_CODES[404]);
}

function setCacheDuration(res, duration) {
    res.setHeader('Cache-Control', format('public, max-age=%d', duration));
}

function loadPage(res, page, cacheDuration) {
    setCacheDuration(res, cacheDuration);

    fs.readFileAsync(path.join(templatesDir, format('%s.html', page)), 'utf-8')
        .then(res.end.bind(res)).done();
}

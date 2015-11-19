'use strict';

const http = require('http');

const urls = {
    '\\/search\\/.+': require('./search')
};

module.exports = function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    for (let url in urls) {
        if (req.url.match(new RegExp('\\/api' + url))) {
            return urls[url](req, res);
        }
    }

    res.statusCode = 404;
    return res.end(http.STATUS_CODES[404]);
};

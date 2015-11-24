'use strict';

const http = require('http');

const Promise = require('bluebird');

const db = require('../shared/db');

// Monkey patch http because this method should exist
http.ServerResponse.prototype.endWith = function(code) {
    this.statusCode = code;
    this.end();
};

const controllers = {
    '\\/search\\/.+': require('./search'),
    '\\/packages\\/.+': require('./packages')
};

module.exports = function(req, res) {
    Promise.using(db(), function(client) {
        return client.queryAsync({
            name: 'get_maintenance_mode',
            text: 'select value from maintenance_mode',
            values: []
        }).get(0).get('rows').get(0).get('value').then(function(mode) {
            if (mode === 'on') {
                res.statusCode = 503;
                return res.end(http.STATUS_CODES[503]);
            }

            for (let url in controllers) {
                if (req.url.match(new RegExp('\\/api' + url))) {
                    res.setHeader('Content-Type', 'application/json');
                    return controllers[url](req, res);
                }
            }

            res.statusCode = 404;
            return res.end(http.STATUS_CODES[404]);
        });
    });
};

'use strict';

const log = require('util').log;

const Promise = require('bluebird');

const db = require('../shared/db');

module.exports = function(req, res) {
    Promise.using(db(), function(client) {
        return client.queryAsync({
            name: 'search_entries',
            text: "select name, version, distribution from source where name like $1",
            values: ['%' + req.url.split('/').slice(3).join('/') + '%']
        }).get('rows').then(function(entries) {
            let ret = {};
            if (entries.length === 0) {
                ret.status = 1;
                ret.results = [];
            }
            // Hard limit of 20, just in case.
            else if (entries.length > 20) {
                ret.status = 2;
                ret.results = entries.slice(0, 20);
            }
            else {
                ret.status = 0;
                ret.results = entries;
            }

            res.end(JSON.stringify(ret, null, 4));
        }).catch(function(err) {
            log(err);
            res.statusCode = 500;
            res.end(JSON.stringify({status: -1}, null, 4));
        });
    });
};

'use strict';

const http = require('http');
const log = require('util').log;
const f = require('util').format;
const fs = require('fs');

const Promise = require('bluebird');

Promise.promisifyAll(fs);

const db = require('../shared/db');

const render = require('./renderer');
const downloadSource = require('./source-downloader');

let locks = [];

module.exports = function(req, res) {
    const parts = req.url.split('/').slice(3);
    const lockName = getLockName(parts[1], parts[2]);

    Promise.using(db(), function(client) {
        return client.queryAsync({
            name: 'get_entries',
            text: 'select distribution, name, version from source where distribution = $1 and name = $2 and version = $3',
            values: [parts[0], parts[1], parts[2]]
        }).get(0).get('rows').then(function(entries) {
            if (entries.length === 0) {
                return res.endWith(404);
            }

            if (entries.length > 1) {
                return res.endWith(400);
            }

            if (locks.indexOf(lockName) > -1) {
                return res.endWith(202);
            }

            locks.push(lockName);

            return client.queryAsync({
                name: 'get_source_folder',
                text: 'select path from source_folder where path like $1',
                values: [f('%%%s_%s', parts[1], parts[2])]
            }).get(0).then(function(result) {
                if (result.rowCount > 0) {
                    return render(result.rows[0].path, parts.slice(3).join('/'), res);
                }

                // In this case, we haven't downloaded the source,
                // so tell the client to come back later.
                res.endWith(202);

                return downloadSource(parts[1], parts[2]);
            });
        });
    }).then(function() {
        // Let's not forget to release the lock.
        locks.splice(locks.indexOf(lockName), 1);
    }).catch(function(err) {
        log(err);
        res.statusCode = 500;
        res.end();
    });
};

function getLockName(name, version) {
    return f('%s:%s', name, version);
}

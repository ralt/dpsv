'use strict';

const db = require('../shared/db');

const getSources = require('./sources');
const createOrUpdateEntries = require('./entries');

module.exports = function() {
    return Promise.using(db(), function(client) {
        return client.queryAsync({
            name: 'get_distributions',
            text: 'select enum_range(null::distribution)',
            values: []
        }).get('rows').map(function(distribution) {
            getSources(distribution)
                .then(createOrUpdateEntries)
                .done();
        });
    });
};

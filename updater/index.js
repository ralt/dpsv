'use strict';

const Promise = require('bluebird');

const db = require('../shared/db');

const getSources = require('./sources');
const entries = require('./entries');
const insertEntries = entries.insert;
const deleteEntries = entries.delete;

module.exports = function() {
    return Promise.using(db(), function(client) {
        return client.queryAsync({
            name: 'set_maintenance_mode',
            text: 'update maintenance_mode set value = $1',
            values: ['on']
        }).then(function() {
            return client.queryAsync({
                name: 'get_distributions',
                text: 'select enum_range(null::distribution)',
                values: []
            });
        }).get(0).get('rows').get(0).get('enum_range').then(function(range) {
            return range.match(/{(.+)}/)[1].split(',');
        }).map(function(distribution) {
            deleteEntries(distribution)
                .then(getSources)
                .then(insertEntries)
                .done();
        }).then(function() {
            return client.queryAsync({
                name: 'unset_maintenance_mode',
                text: 'update maintenance_mode set value = $1',
                values: ['off']
            });
        });
    });
};

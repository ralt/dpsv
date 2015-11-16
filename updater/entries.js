'use strict';

const util = require('util');

const Promise = require('bluebird');
const db = require('../shared/db');

module.exports = insertOrUpdateEntries;

function insertOrUpdateEntries(sources) {
    Promise.using(db(), function(client) {
        return client.queryAsync({
            name: 'count_sources',
            text: 'select count(*) from source where distribution = $1',
            values: [sources[0].distribution]
        }).get('rows').get(0).then(function(count) {
            console.debug(util.format('%d sources already imported.', count));

            if (count === 0) {
                console.debug('First time importing sources.');
                return insertSources(sources);
            }

            // If this code is reached, it's an update.
            // There are 2 parts:
            //   - The new sources
            //   - The updated sources (version changes)
            // No matter what, it has to fetch all the
            // existing entries to compare them.
            return client.queryAsync({
                name: 'get_entries',
                text: 'select name, version from source where distribution = $1',
                values: [sources[0].distribution]
            });
        }).get('rows').then(function(entries) {
            const entriesNames = entries.map(function(entry) {
                return entry.name;
            });

            const newSources = sources.filter(function(source) {
                return entriesNames.indexOf(source.name) === -1;
            });

            const existingSources = sources.filter(function(source) {
                return entriesNames.indexOf(source.name) > -1;
            });

            const updatedSources = existingSources.filter(function(source) {
                return getEntry(entries, source.name).version !== source.version;
            });

            return [
                insertSources(newSources),
                updateSources(updatedSources)
            ];
        });
    });
}

function updateSources(sources) {
    return Promise.using(db(), function(client) {
        return sources.map(function(source) {
            return client.queryAsync({
                name: 'update_source',
                text: 'update source set version = $1 where name = $2 and distribution = $3',
                values: [source.version, source.name, source.distribution]
            });
        });
    });
}

function getEntry(entries, name) {
    return entries.find(function(entry) {
        return entry.name === name;
    });
}

function insertSources(sources) {
    // Pseudo query builder
    let params = [];
    let chunks = [];
    for (let i = 0; i < sources.length; i++) {
        let source = sources[i];
        let valuesClause = [];

        params.push(source.name);
        valueClause.push('$' + params.length);

        params.push(source.distribution);
        valueClause.push('$' + params.length);

        params.push(source.version);
        valueClause.push('$' + params.length);

        chunks.push('(' + valueClause.join(', ') + ')');
    }
    return Promise.using(db(), function(client) {
        return client.queryAsync({
            name: 'insert_sources',
            text: 'insert into source(name, distribution, version) values ' +
                chunks.join(', '),
            values: params
        });
    });
}

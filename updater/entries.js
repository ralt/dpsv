'use strict';

const format = require('util').format;

const Promise = require('bluebird');
const db = require('../shared/db');

module.exports = {
    insert: insertEntries,
    delete: deleteEntries
};

function deleteEntries(distribution) {
    return Promise.using(db(), function(client) {
        console.log(format('Deleting all the entries for %s...', distribution));
        return client.queryAsync({
            name: 'delete_entries',
            text: 'delete from source where distribution = $1',
            values: [distribution]
        }).then(function() {
            console.log(format('Entries for %s deleted.', distribution));
            return distribution;
        });
    });
}

function insertEntries(sources) {
    console.log(format('Inserting %d entries for %s...', sources.length, sources[0].distribution));
    // Pseudo query builder
    let params = [];
    let chunks = [];
    for (let i = 0; i < sources.length; i++) {
        let source = sources[i];
        let valuesClause = [];

        params.push(source.name);
        valuesClause.push('$' + params.length);

        params.push(source.distribution);
        valuesClause.push('$' + params.length);

        params.push(source.version);
        valuesClause.push('$' + params.length);

        chunks.push('(' + valuesClause.join(', ') + ')');
    }
    return Promise.using(db(), function(client) {
        return client.queryAsync({
            name: 'insert_sources',
            text: 'insert into source(name, distribution, version) values ' +
                chunks.join(', '),
            values: params
        }).then(function() {
            console.log(format('Entries for %s inserted.', sources[0].distribution));
        });
    });
}

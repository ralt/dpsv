'use strict';

const format = require('util').format;
const log = require('util').log;

const Promise = require('bluebird');
const db = require('../shared/db');

module.exports = {
    insert: insertEntries,
    delete: deleteEntries
};

function deleteEntries(distribution) {
    return Promise.using(db(), function(client) {
        log(format('Deleting all the entries for %s...', distribution));
        return client.queryAsync({
            name: 'delete_entries',
            text: 'delete from source where distribution = $1',
            values: [distribution]
        }).then(function() {
            log(format('Entries for %s deleted.', distribution));
            return distribution;
        });
    });
}

function insertEntries(sources) {
    log(format('Inserting %d entries for %s...', sources.length, sources[0].distribution));
    return Promise.map(sources, insertEntry).then(function() {
        log(format('Entries for %s inserted.', sources[0].distribution));
    });
}

function insertEntry(source) {
    return Promise.using(db(), function(client) {
        return client.queryAsync({
            name: 'insert_source',
            text: 'insert into source(name, distribution, version, directory, original_archive, original_archive_md5sum, debian_archive, debian_archive_md5sum) values ($1, $2, $3, $4, $5, $6, $7, $8)',
            values: [source.name, source.distribution, source.version, source.directory, source.original_archive, source.original_archive_md5sum, source.debian_archive, source.debian_archive_md5sum]
        });
    });
}

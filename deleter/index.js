'use strict';

const Promise = require('bluebird');
const rmdir = Promise.promisify(require('rimraf'));
const db = require('../shared/db');

module.exports = function() {
    getOldFolders().then(deleteFolders).done();
};

function getOldFolders() {
    return Promise.using(db(), function(client) {
        return client.queryAsync({
            name: 'get_old_folders',
            text: "select path from source_folder where created < ( now() - interval '24 hours' )",
            values: []
        }).get('rows');
    });
}

function deleteFolders(folders) {
    return deleteFolderEntries(folders).then(deleteFilesystemFolders);
}

function deleteFolderEntries(folders) {
    return folders.map(deleteFolderEntry);
}

function deleteFolderEntry(folder) {
    return Promise.using(db(), function(client) {
        return client.queryAsync({
            name: 'delete_folder',
            text: 'delete from source_folder where path = $1',
            values: [folder]
        });
    });
}

function deleteFilesystemFolders(folders) {
    return folders.map(rmdir);
}

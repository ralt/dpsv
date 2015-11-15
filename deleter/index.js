'use strict';

const db = require('../shared/db');

module.exports = function() {
    getOldFolders().then(deleteFolders).done();
};

function getOldFolders() {
}

function deleteFolders(folders) {
    return deleteFolderEntries(folders).then(deleteFilesystemFolders);
}

function deleteFolderEntries(folder) {
}

function deleteFilesystemFolders(folders) {
}

'use strict';

const fs = require('fs');
const f = require('util').format;
const log = require('util').log;
const exec = require('child_process').exec;
const path = require('path');

const Promise = require('bluebird');

const db = require('../shared/db');
const downloadArchive = require('../shared/download-archive');

Promise.promisifyAll(fs);
const execAsync = Promise.promisify(exec);

/*
 Debian sources are in 2 parts:
   - The 1st archive is the original upstream source.
   - The 2nd archive is the debian/ folder added by debian maintainers.
 */

const sourceArchiveBaseUrl = 'http://http.debian.net/debian/%s/%s';

const baseFolder = process.env.SOURCES_FOLDER || '/tmp';

module.exports = function(name, version, directory, archive, debianArchive) {
    const sourceFolder = path.join(baseFolder, f('%s_%s', name, version));

    return Promise.each([
        downloadAndExtractArchive(archive, sourceFolder, directory),
        downloadAndExtractArchive(debianArchive, sourceFolder, directory, true)
    ]).then(function() {
        return Promise.using(db(), function(client) {
            return client.queryAsync({
                name: 'insert_source_folder',
                text: 'insert into source_folder (path) values($1)',
                values: [sourceFolder]
            });
        });
    });
};

function downloadAndExtractArchive(archive, sourceFolder, directory, isDebian) {
    if (!archive) {
        return;
    }

    const archiveUrl = f(sourceArchiveBaseUrl, directory, archive);
    const archiveFilename = path.join(baseFolder, archive);

    return downloadArchive(archiveUrl).then(function(archiveContent) {
        return fs.writeFileAsync(archiveFilename, archiveContent);
    }).then(function() {
        return execAsync(f(
            'mkdir -p %s && tar xf %s %s -C %s',
            sourceFolder,
            archiveFilename,
            isDebian ? '' : '--strip-components=1',
            sourceFolder
        ));
    }).then(function() {
        return fs.unlinkAsync(archiveFilename);
    }).catch(function(err) {
        log(err);
    });
}

function getOrigVersion(version) {
    return version.replace(/-.*/, '');
}

function getSourceFolder(name, version) {
    return path.join(baseFolder, path.sep, f('%s_%s', name, version));
}

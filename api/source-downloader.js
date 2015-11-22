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
    const archiveUrl = f(
        sourceArchiveBaseUrl, directory, archive
    );
    const debianArchiveUrl = f(
        sourceArchiveBaseUrl, directory, debianArchive
    );

    const archiveFilename = path.join(baseFolder, archive);
    const debianArchiveFilename = path.join(baseFolder, debianArchive);

    const sourceFolder = path.join(baseFolder, f('%s_%s', name, version));

    return Promise.using(db(), function(client) {
        return Promise.all([
            downloadArchive(archiveUrl),
            downloadArchive(debianArchiveUrl)
        ]).spread(function(archiveContent, debianArchiveContent) {
            return [
                fs.writeFileAsync(
                    archiveFilename,
                    archiveContent
                ),
                fs.writeFileAsync(
                    debianArchiveFilename,
                    debianArchiveContent
                )
            ];
        }).then(function() {
            // First, extract the original source,
            // then, the debian archive.
            return execAsync(f(
                'mkdir -p %s && tar xf %s --strip-components=1 -C %s',
                sourceFolder,
                archiveFilename,
                sourceFolder
            ));
        }).then(function() {
            return execAsync(f(
                'tar xf %s -C %s',
                debianArchiveFilename,
                sourceFolder
            ));
        }).then(function() {
            return client.queryAsync({
                name: 'insert_source_folder',
                text: 'insert into source_folder (path) values($1)',
                values: [sourceFolder]
            });
        }).then(function() {
            // Clean up the archives
            return [
                fs.unlinkAsync(archiveFilename),
                fs.unlinkAsync(debianArchiveFilename)
            ];
        }).catch(function(err) {
            log(err);
        });
    });
};

function getOrigVersion(version) {
    return version.replace(/-.*/, '');
}

function getSourceFolder(name, version) {
    return path.join(baseFolder, path.sep, f('%s_%s', name, version));
}

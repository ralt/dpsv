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
 Debian sources have several ways to be stored.

 - The classic way:
   - 1 .orig.tar.*z archive, having the upstream sources
   - 1 .debian.tar.*z archive, having the debian sources

 - The diff way:
   - 1 .orig.tar.*z archive, having the upstream sources
   - 1 .diff.gz compressed file, being a patch of debian over the upstream sources

 - The upstream way (when debian *is* the upstream)
   - 1 .debian.tar.*z archive

 All the code below is kinda messy because of this.

 Looking at dpkg-source's code, there is no clean way to handle this,
 you have to look at the extension of the files and figure out based
 on this what to do. (In the index, there's a "Files" section, but
 no information as to what a file is.)
 */

const sourceArchiveBaseUrl = 'http://http.debian.net/debian/%s/%s';

const baseFolder = process.env.SOURCES_FOLDER || '/tmp';

module.exports = function(name, version, directory, archive, debianArchive) {
    const sourceFolder = path.join(baseFolder, f('%s_%s', name, version));

    if (debianArchive.match(/\.diff\.gz$/)) {
        // According to http://ftp.debian.org/debian/doc/source-unpack.txt,
        // the .diff.gz can be completely ignored.
        return downloadAndExtractArchive(
            archive,
            sourceFolder,
            directory,
            debianArchive
        ).then(writeSourceFolder(sourceFolder));
    }

    return Promise.all([
        downloadAndExtractArchive(archive, sourceFolder, directory),
        downloadAndExtractArchive(debianArchive, sourceFolder, directory, true, !archive)
    ]).then(writeSourceFolder(sourceFolder));
};

function writeSourceFolder(sourceFolder) {
    return function() {
        return Promise.using(db(), function(client) {
            return client.queryAsync({
                name: 'insert_source_folder',
                text: 'insert into source_folder (path) values($1)',
                values: [sourceFolder]
            });
        });
    };
}

function downloadAndExtractArchive(archive, sourceFolder, directory, isDebian, isOnlyArchive) {
    if (!archive) {
        return '';
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
            (isDebian && !isOnlyArchive) ? '' : '--strip-components=1',
            sourceFolder
        ));
    }).then(function() {
        return fs.unlinkAsync(archiveFilename);
    }).catch(function(err) {
        log(err);
    });
}

'use strict';

const fs = require('fs');
const f = require('util').format;

const Promise = require('bluebird');

const db = require('../shared/db');
const downloadArchive = require('../shared/download-archive');

Promise.promisifyAll(fs);

/*
 Debian sources are in 2 parts:
   - The 1st archive is the original upstream source.
   - The 2nd archive is the debian/ folder added by debian maintainers.
 */
const sourceArchiveUrl = 'http://http.debian.net/debian/pool/main/%s/%s/%s_%s.orig.tar.gz';
const debianSourceArchiveUrl = 'http://http.debian.net/debian/pool/main/%s/%s/%s_%s.debian.tar.xz';

const baseFolder = process.env.BASE_FOLDER || '/tmp';

module.exports = function(name, version) {
    const archiveUrl = f(
        sourceArchiveUrl, name[0], name, name, getOrigVersion(version)
    );
    const debianArchiveUrl = f(
        debianSourceArchiveUrl, name[0], name, name, version
    );

    const archiveFilename = getArchiveFilename(name, version);
    const debianArchiveFilename = getDebianArchiveFilename(name, version);
    const sourceFolder = getSourceFolder(name, version);

    return Promise.using(db(), function(client) {
        return Promise.all([
            downloadArchive(archiveUrl),
            downloadArchive(debianArchiveUrl)
        ]).spread(function(archive, debianArchive) {
            return [
                fs.writeFileAsync(
                    archiveFilename,
                    archive
                ),
                fs.writeFileAsync(
                    debianArchiveFilename,
                    debianArchive
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

function getArchiveFilename(name, version) {
    return path.join(baseFolder, path.sep, f('%s_%s.orig.tar.gz', name, version));
}

function getDebianArchiveFilename(name, version) {
    return path.join(baseFolder, path.sep, f('%s_%s.tar.xz', name, version));
}

function getSourceFolder(name, version) {
    return path.join(baseFolder, path.sep, f('%s_%s', name, version));
}

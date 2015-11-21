'use strict';

const http = require('http');
const log = require('util').log;
const f = require('util').format;
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

const Promise = require('bluebird');

Promise.promisifyAll(fs);
const execAsync = Promise.promisify(exec);

const db = require('../shared/db');
const downloadArchive = require('../shared/download-archive');

let locks = [];

module.exports = function(req, res) {
    const parts = req.url.split('/').slice(3);
    const lockName = getLockName(parts[1], parts[2]);

    Promise.using(db(), function(client) {
        return client.queryAsync({
            name: 'get_entries',
            text: 'select distribution, name, version from source where distribution = $1 and name = $2 and version = $3',
            values: [parts[0], parts[1], parts[2]]
        }).get(0).get('rows').then(function(entries) {
            if (entries.length === 0) {
                return res.endWith(404);
            }

            if (entries.length > 1) {
                return res.endWith(400);
            }

            if (locks.indexOf(lockName) > -1) {
                return res.endWith(202);
            }

            locks.push(lockName);

            return client.queryAsync({
                name: 'get_source_folder',
                text: 'select path from source_folder where path like $1',
                values: [f('%%%s_%s', parts[1], parts[2])]
            }).get(0).then(function(result) {
                if (result.rowCount > 0) {
                    return renderFilename(result.rows[0].path, parts.slice(3).join('/'), res);
                }

                // In this case, we haven't downloaded the source,
                // so tell the client to come back later.
                res.endWith(202);

                return downloadSource(parts[1], parts[2]);
            });
        });
    }).then(function() {
        // Let's not forget to release the lock.
        locks.splice(locks.indexOf(lockName), 1);
    }).catch(function(err) {
        log(err);
        res.statusCode = 500;
        res.end();
    });
};

function renderFilename(path, filename, res) {
    let fileType;
    let realpath = f('%s/%s', path, filename);
    fs.statAsync(realpath).then(function(stats) {
        fileType = stats.isFile() ? 'file' : 'folder';
        return stats.isFile() ?
            fs.readFileAsync(realpath, 'utf-8') :
            renderFolder(realpath);
    }).then(function(content) {
        res.end(JSON.stringify({
            fileType: fileType,
            data: {
                breadcrumb: filename.split('/'),
                content: content
            }
        }));
    }).catch(function() {
        // Source exists but not the filename
        res.endWith(404);
    });
}

function renderFolder(realpath) {
    return fs.readdirAsync(realpath).map(function(filename) {
        return fs.statAsync(f('%s/%s', realpath, filename)).then(function(stat) {
            return {
                name: filename,
                isFile: stat.isFile(),
                isFolder: stat.isDirectory(),
                mode: stat.mode,
                birthtime: stat.birthtime.getTime(),
                mtime: stat.mtime.getTime()
            };
        });
    });
}

/*
 Debian sources are in 2 parts:
   - The 1st archive is the original upstream source.
   - The 2nd archive is the debian/ folder added by debian maintainers.
 */
const sourceArchiveUrl = 'http://http.debian.net/debian/pool/main/%s/%s/%s_%s.orig.tar.gz';
const debianSourceArchiveUrl = 'http://http.debian.net/debian/pool/main/%s/%s/%s_%s.debian.tar.xz';

const baseFolder = process.env.BASE_FOLDER || '/tmp';

function downloadSource(name, version) {
    const archiveUrl = f(sourceArchiveUrl, name[0], name, name, getOrigVersion(version));
    const debianArchiveUrl = f(debianSourceArchiveUrl, name[0], name, name, version);

    return Promise.using(db(), function(client) {
        return Promise.all([
            downloadArchive(archiveUrl),
            downloadArchive(debianArchiveUrl)
        ]).spread(function(archive, debianArchive) {
            return [
                fs.writeFileAsync(
                    getArchiveFilename(name, version),
                    archive
                ),
                fs.writeFileAsync(
                    getDebianArchiveFilename(name, version),
                    debianArchive
                )
            ];
        }).then(function() {
            // First, extract the original source,
            // then, the debian archive.
            return execAsync(f(
                'mkdir -p %s && tar xf %s --strip-components=1 -C %s',
                getSourceFolder(name, version),
                getArchiveFilename(name, version),
                getSourceFolder(name, version)
            ));
        }).then(function() {
            return execAsync(f(
                'tar xf %s -C %s',
                getDebianArchiveFilename(name, version),
                getSourceFolder(name, version)
            ));
        }).then(function() {
            return client.queryAsync({
                name: 'insert_source_folder',
                text: 'insert into source_folder (path) values($1)',
                values: [getSourceFolder(name, version)]
            });
        }).then(function() {
            // Clean up the archives
            return [
                fs.unlinkAsync(getArchiveFilename(name, version)),
                fs.unlinkAsync(getDebianArchiveFilename(name, version))
            ];
        }).catch(function(err) {
            log(err);
        });
    });
}

function getLockName(name, version) {
    return f('%s:%s', name, version);
}

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

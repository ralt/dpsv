'use strict';

const http = require('http');
const log = require('util').log;
const f = require('util').format;
const fs = require('fs');

const Promise = require('bluebird');

Promise.promisifyAll(fs);

const db = require('../shared/db');

module.exports = function(req, res) {
    const parts = req.url.split('/').slice(3);
    Promise.using(db(), function(client) {
        client.queryAsync({
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

            return client.queryAsync({
                name: 'get_source_folder',
                text: 'select path from source_folder where path like $1',
                values: [f('%%%s/%s/%s', parts[0], parts[1], parts[2])]
            });
        }).get(0).get('rows').then(function(rows) {
            if (rows[0]) {
                return renderFilename(rows[0].path, parts.slice(3).join('/'), res);
            }

            // In this case, we haven't downloaded or finished
            // uncompressing the folder yet. While this is done,
            // tell the client to come back later.
            res.endWith(202);

            return downloadSource(parts[1], parts[2]);
        }).catch(function(err) {
            log(err);
            res.statusCode = 500;
            res.end();
        });
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
const sourceArchiveUrl = 'http://httpredir.debian.net/debian/pool/main/%s/%s/%s_%s.orig.tar.gz';
const debianSourceArchiveUrl = 'http://httpredir.debian.net/debian/pool/main/%s/%s/%s_%s.debian.tar.xz';

function downloadSource(name, version) {
    const archiveUrl = f(sourceArchiveUrl, name[0], name, name, version);
    const debianArchiveUrl = f(debianSourceArchiveUrl, name[0], name, name, version);
}

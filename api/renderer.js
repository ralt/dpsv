'use strict';

const fs = require('fs');
const f = require('util').format;
const exec = require('child_process').exec;
const log = require('util').log;

const Promise = require('bluebird');

Promise.promisifyAll(fs);

const execAsync = Promise.promisify(exec);

module.exports = function(path, filename, res) {
    let fileType;
    let realpath = f('%s/%s', path, filename);
    fs.statAsync(realpath).then(function(stats) {
        fileType = stats.isFile() ? 'file' : 'folder';
        return stats.isFile() ?
            renderFile(realpath) :
            renderFolder(realpath);
    }).then(function(content) {
        res.end(JSON.stringify({
            fileType: fileType,
            breadcrumb: filename.split('/'),
            content: content
        }));
    }).catch(function(err) {
        log(err);
        // Source exists but not the filename
        res.endWith(404);
    });
};

function renderFile(realpath) {
    const pygmentizedPath = f('%s.html', realpath);
    return fs.readFileAsync(pygmentizedPath, 'utf-8').catch(function(err) {
        if (err.code !== 'ENOENT') {
            // We only handle non-existing files.
            throw err;
        }

        return execAsync(f(
            'pygmentize -o %s -O linenos=1,lineanchors=L,anchorlinenos=1 %s',
            pygmentizedPath,
            realpath
        )).then(function() {
            return fs.readFileAsync(pygmentizedPath, 'utf-8');
        }).catch(function(err) {
            log(err);
            // If we can't run pygmentize on it, just return the raw file
            return fs.readFileAsync(realpath, 'utf-8');
        });
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

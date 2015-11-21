'use strict';

const fs = require('fs');
const f = require('util').format;

const Promise = require('bluebird');

Promise.promisifyAll(fs);

module.exports = function(path, filename, res) {
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
            breadcrumb: filename.split('/'),
            content: content
        }));
    }).catch(function() {
        // Source exists but not the filename
        res.endWith(404);
    });
};

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

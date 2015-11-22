'use strict';

const zlib = require('zlib');
const format = require('util').format;
const log = require('util').log;

const Promise = require('bluebird');

const downloadArchive = require('../shared/download-archive');

Promise.promisifyAll(zlib);

const sourcesUrl = 'http://httpredir.debian.org/debian/dists/%s/main/source/Sources.gz';

module.exports = function(distribution) {
    const url = format(sourcesUrl, distribution);
    log(format('Downloading %s...', url));
    return downloadArchive(url)
        .then(function(data) {
            log(format('%s downloaded.', url));
            log(format('Uncompressing the sources for %s...', distribution));
            return data;
        })
        .then(zlib.gunzipAsync)
        .then(function(data) {
            log(format('Sources for %s uncompressed.', distribution));
            log(format('Parsing sources for %s...', distribution));
            return data;
        })
        .then(parseSources(distribution))
        .then(function(sources) {
            log(format('Sources for %s parsed.', distribution));
            return sources;
        });
};

function parseSources(distribution) {
    return function(sources) {
        let sourcesText = sources.toString().split(/\n\n/);
        // Last item is empty
        sourcesText.splice(-1, 1);
        return sourcesText.map(parseSource(distribution));
    };
}

function parseSource(distribution) {
    return function(source) {
        const lines = source.split(/\n/);

        const filesLines = getEntry(lines, 'Files:');
        const parsedFilesLines = parseFilesLines(filesLines);

        return {
            name: getEntry(lines, 'Package:')[0],
            version: getEntry(lines, 'Version:')[0],
            distribution: distribution,
            directory: getEntry(lines, 'Directory:')[0],
            original_archive: parsedFilesLines.original_archive,
            debian_archive: parsedFilesLines.debian_archive
        };
    };
}

function parseFilesLines(lines) {
    const parsedLines = lines.map(function(line) {
        const parts = line.split(' ');
        return {
            md5sum: parts[0],
            size: parts[1],
            filename: parts[2]
        };
    });
    return {
        original_archive: getOriginalArchive(parsedLines),
        debian_archive: getDebianArchive(parsedLines)
    };
}

function getOriginalArchive(parsedLines) {
    for (var i = 0; i < parsedLines.length; i++) {
        if (parsedLines[i].filename.match(/\.orig\.tar\.(b|g|x)z2?$/)) {
            return parsedLines[i].filename;
        }
    }
}

function getDebianArchive(parsedLines) {
    for (var i = 0; i < parsedLines.length; i++) {
        if (!parsedLines[i].filename.match(/\.orig\.tar\.(b|g|x)z2?$/) &&
            parsedLines[i].filename.match(/(\.tar\.(b|g|x)z2?|\.diff\.gz)$/)) {
            return parsedLines[i].filename;
        }
    }
}

function getEntry(lines, begin) {
    var ret = [];
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].indexOf(begin) < 0) {
            continue;
        }
        var match;
        if ((match = lines[i].match(/:(.+)$/))) {
            ret.push(match[1].trim());
        }
        while (/^ .+/.test(lines[++i])) {
            ret.push(lines[i].trim());
        }
        return ret;
    }
}

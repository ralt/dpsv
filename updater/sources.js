'use strict';

const zlib = require('zlib');
const format = require('util').format;
const log = require('util').log;

const Promise = require('bluebird');
const request = require('request-promise');

Promise.promisifyAll(request);
Promise.promisifyAll(zlib);

const sourcesUrl = 'http://httpredir.debian.org/debian/dists/%s/main/source/Sources.gz';

module.exports = function(distribution) {
    // Remove me
    const fs = require('fs');
    Promise.promisifyAll(fs);
    return fs.readFileAsync('Sources', 'utf-8').then(parseSources(distribution));
    // Remove me

    const url = format(sourcesUrl, distribution);
    log(format('Downloading %s...', url));
    return request(url)
        .then(function(data) {
            log(format('%s downloaded.', url));
            log('Uncompressing the sources...');
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
        let sourcesText = sources.split(/\n\n/);
        // Last item is empty
        sourcesText.splice(-1, 1);
        return sourcesText.map(parseSource(distribution));
    };
}

function parseSource(distribution) {
    return function(source) {
        const lines = source.split(/\n/);
        return {
            name: getLine(lines, 'Package:'),
            version: getLine(lines, 'Version:'),
            distribution: distribution
        };
    };
}

function getLine(lines, begin) {
    return lines.find(function(line) {
        return line.indexOf(begin) === 0;
    }).match(/:(.+)$/)[1].trim();
}

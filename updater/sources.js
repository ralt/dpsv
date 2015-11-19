'use strict';

const zlib = require('zlib');
const format = require('util').format;

const Promise = require('bluebird');
const request = require('request-promise');

Promise.promisifyAll(request);
Promise.promisifyAll(zlib);

const sourcesUrl = 'http://httpredir.debian.org/debian/dists/%s/main/source/Sources.gz';

module.exports = function(distribution) {
    return request(format(sourcesUrl, distribution))
        .then(zlib.gunzipAsync)
        .then(parseSources(distribution));
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

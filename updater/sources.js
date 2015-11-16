'use strict';

const request = require('request-promise');
const zlib = require('zlib');

Promise.promisifyAll(request);
Promise.promisifyAll(zlib);

module.exports = function(sourcesArchiveUrl, distribution) {
    return request(sourcesArchiveUrl)
        .then(zlib.gunzipAsync)
        .then(parseSources(distribution));
};

function parseSources(distribution) {
    return function(sources) {
        return sources.split(/\n\n/).map(parseSource(distribution));
    };
}

function parseSource(distribution) {
    return function(source) {
        const lines = source.split(/\n/);
        return {
            package: getLine(lines, 'Package:'),
            version: getLine(lines, 'Version:'),
            distribution: distribution
        };
    };
}

function getLine(lines, begin) {
    return lines.find(function(line) {
        return line.indexOf(begin) === 0;
    });
}

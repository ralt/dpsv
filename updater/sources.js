'use strict';

const zlib = require('zlib');

const request = require('request-promise');

Promise.promisifyAll(request);
Promise.promisifyAll(zlib);

const sourcesUrl = 'http://httpredir.debian.org/debian/dists/%s/main/source/Sources.gz';

module.exports = function(distribution) {
    return request(util.format(sourcesUrl, distribution))
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

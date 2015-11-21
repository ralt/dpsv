'use strict';

var Promise = require('bluebird');

var xhr = require('../shared/xhr');
var format = require('../shared/format');

var renderBreadcrumb = require('./breadcrumb');

var distributions = ['stable', 'testing', 'unstable', 'experimental'];

var waitDiv = document.querySelector('#wait');

var fileTypeRenderers = {
    file: require('./renderers').file,
    folder: require('./renderers').folder
};

var source;
try {
    source = pathToSource(window.location.pathname);
} catch(e) {
    catchError(e);
}

(function r() {
    findSource(source).spread(function(status, response) {
        switch (status) {
        case 200:
            document.querySelector('#header').classList.add('up');
            waitDiv.remove();
            renderBreadcrumb(response.breadcrumb);
            fileTypeRenderers[response.fileType](response.content);
            break;
        case 202:
            window.setTimeout(r, 1000);
            break;
        case 404:
            throw new Error(
                format("The file %s was not found in this source.", source.filename)
            );
        default:
            throw new Error('There was a server error. Please try again later.');
        }
    }).catch(function(e) {
        catchError(e);
    });
}());

function catchError(e) {
    waitDiv.remove();
    showError(e.message);
}

function findSource(source) {
    var url = format(
        '/api/packages/%s/%s/%s/%s',
        source.distribution,
        source.name,
        source.version,
        source.filename
    );

    return new Promise(function(resolve, request) {
        // We're doing the xhr request manually since
        // we need the status code.
        // Eventually, all the XHRs will use this system,
        // so this special snowflake won't be needed.
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState !== 4) {
                return;
            }

            resolve([xhr.status, xhr.response]);
        };
        xhr.responseType = 'json';
        xhr.open('GET', url);
        xhr.send();
    });
}

function pathToSource(path) {
    var parts = path.split('/').filter(Boolean).slice(1);
    if (distributions.indexOf(parts[0]) === -1) {
        throw new Error(
            format("The distribution %s doesn't exist or isn't supported.", parts[0])
        );
    }

    if (parts.length < 3) {
        throw new Error("The URL you're trying to reach is too short.");
    }

    var source = {};
    source.distribution = parts[0];
    source.name = parts[1];
    source.version = parts[2];
    source.filename = parts.slice(3).join('/');
    return source;
}

function showError(msg) {
    var errorDiv = document.querySelector('#error');
    errorDiv.textContent = msg;
    errorDiv.hidden = false;
}

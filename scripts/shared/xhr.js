'use strict';

var Promise = require('bluebird');

module.exports = function(url) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            resolve(xhr.response);
        };
        xhr.onerror = reject;
        xhr.responseType = 'json';
        xhr.open('GET', url);
        xhr.send();
    });
};

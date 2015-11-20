'use strict';

var xhr = require('../shared/xhr');
var throttle = require('../shared/throttler');

// For documentation purpose
var STATUS_OK = 0;
var STATUS_NO_RESULT = 1;
var STATUS_TOO_MANY_RESULTS = 2;
var STATUS_ERROR = -1;

var renderers = {
    0: renderResults,
    1: renderNoResult,
    2: renderTooManyResults
};
renderers[-1] = renderError;

function search(str) {
    return xhr('/api/search/' + str).then(function(response) {
        hideAlerts();
        return renderers[response.status](response.results);
    });
}

var searchInput = document.querySelector('#search');

searchInput.addEventListener('input', function() {
    window.history.pushState({}, '', '?' + this.value);
    window.onpopstate();
});


window.onpopstate = throttle(300, function() {
    if (searchInput.value === '') {
        clearResults();
        return;
    }
    search(window.location.search.slice(1));
});

if (window.location.search.length > 1) {
    search(window.location.search.slice(1));
    searchInput.value = window.location.search.slice(1);
}

var resultsTable = document.querySelector('#results');

function clearResults() {
    var trs = resultsTable.querySelectorAll('tbody > tr');
    for (var i = 0; i < trs.length; i++) {
        trs[i].remove();
    }
}

function renderResults(results) {
    clearResults();

    var tbody = resultsTable.querySelector('tbody');
    var newTr;
    for (var i = 0; i < results.length; i++) {
        newTr = makeRow(results[i], !(i % 2));
        tbody.appendChild(newTr);
    }
}

function makeRow(result, isEven) {
    var tr = document.createElement('tr');
    var distributionTd = document.createElement('td');
    var nameTd = document.createElement('td');
    var versionTd = document.createElement('td');
    var linkTd = document.createElement('td');

    tr.className = isEven ? 'even' : 'odd';

    distributionTd.textContent = result.distribution;
    nameTd.textContent = result.name;
    versionTd.textContent = result.version;

    var anchor = document.createElement('a');
    anchor.href = '/packages/' + result.distribution + '/' +
        result.name + '/' + result.version + '/';
    anchor.textContent = 'view source';
    linkTd.appendChild(anchor);

    tr.appendChild(distributionTd);
    tr.appendChild(nameTd);
    tr.appendChild(versionTd);
    tr.appendChild(linkTd);

    return tr;
}

function renderNoResult() {
    // Don't do anything
}

function renderTooManyResults(results) {
    renderResults(results);
    showWarning('There are many results, but only 20 are shown.');
}

function renderError() {
    showError('A server error occured. Please try again later.');
}

var warningDiv = document.querySelector('#warning');
function showWarning(msg) {
    warningDiv.hidden = false;
    warningDiv.textContent = msg;
}

var errorDiv = document.querySelector('#error');
function showError(msg) {
    errorDiv.hidden = false;
    errorDiv.textContent = msg;
}

function hideAlerts() {
    hideWarning();
    hideError();
}

function hideWarning() {
    warningDiv.hidden = true;
}

function hideError() {
    errorDiv.hidden = true;
}

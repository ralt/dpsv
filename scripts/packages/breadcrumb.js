'use strict';

var butlast = require('../shared/butlast');
var format = require('../shared/format');

var breadcrumbDiv = document.querySelector('#breadcrumb');

module.exports = function(bc) {
    var breadcrumb = bc.slice(0);
    var isRoot = bc.length === 1 && bc[0] === '';
    if (!isRoot) {
        // Prepend a root item only when it's not root
        breadcrumb.unshift('');
    }

    var links = renderBreadcrumbLinks(butlast(breadcrumb));
    for (var i = 0; i < links.length; i++) {
        breadcrumbDiv.appendChild(links[i]);
    }

    var lastElement = document.createElement('div');
    lastElement.textContent = breadcrumb[breadcrumb.length - 1] || '/';
    breadcrumbDiv.appendChild(lastElement);

    breadcrumbDiv.hidden = false;
};

function renderBreadcrumbLinks(items) {
    return items.map(function(item, index) {
        var breadcrumbItem = document.createElement('div');
        var breadcrumbAnchor = document.createElement('a');
        breadcrumbAnchor.textContent = item || '/';
        breadcrumbAnchor.href = breadcrumbUrl(item, index);
        breadcrumbItem.appendChild(breadcrumbAnchor);
        return breadcrumbItem;
    });
}

function breadcrumbUrl(item, index) {
    var begin = window.location.pathname.split('/').slice(0, 5).join('/');
    var rest = window.location.pathname.split('/').slice(5).slice(0, index);
    return format(rest.length ? '%s/%s/' : '%s/', begin, rest.join('/'));
}

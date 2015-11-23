'use strict';

var fileDiv = document.querySelector('#file-container');

var folderDiv = document.querySelector('#folder-container');
var folderTbody = folderDiv.querySelector('tbody');

module.exports = {
    file: fileRenderer,
    folder: folderRenderer
};

function fileRenderer(content) {
    fileDiv.innerHTML = content;
    fileDiv.hidden = false;
    if (/#L-\d+/.test(window.location.hash)) {
        // Small hack: empty the hash then put it back
        var hash = window.location.hash;
        window.location.hash = '';
        window.location.hash = hash;
    }
}

function folderRenderer(content) {
    var items = content.sort(function(a, b) {
        return a.name.charCodeAt(0) - b.name.charCodeAt(0);
    });
    var folders = items.filter(function(item) {
        return item.isFolder;
    }).map(createFolderElement);
    var files = items.filter(function(item) {
        return item.isFile;
    }).map(createFileElement);

    var i;
    for (i = 0; i < folders.length; i++) {
        folderTbody.appendChild(folders[i]);
    }

    for (i = 0; i < files.length; i++) {
        folderTbody.appendChild(files[i]);
    }

    folderDiv.hidden = false;
}

function createElementFolder(item, className) {
    var tr = document.createElement('tr');
    tr.className = className;
    var typeTd = document.createElement('td');
    typeTd.textContent = item.isFolder ? 'D' : 'F';
    var nameTd = document.createElement('td');
    var nameAnchor = document.createElement('a');
    nameAnchor.textContent = item.name + (item.isFolder ? '/' : '');
    nameAnchor.href = item.name + (item.isFolder ? '/' : '');
    nameTd.appendChild(nameAnchor);
    var modeTd = document.createElement('td');
    modeTd.textContent = item.mode.toString('8').slice(-3);
    var creationTd = document.createElement('td');
    creationTd.textContent = new Date(item.birthtime).toDateString();
    var modificationTd = document.createElement('td');
    modificationTd.textContent = new Date(item.mtime).toDateString();

    var tds = [typeTd, nameTd, modeTd, creationTd, modificationTd];
    tds.forEach(function(td) {
        tr.appendChild(td);
    });

    return tr;
}

function createFolderElement(item) {
    return createElementFolder(item, 'folder');
}

function createFileElement(item) {
    return createElementFolder(item, 'file');
}

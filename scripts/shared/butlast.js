'use strict';

module.exports = function(arr) {
    if (arr.length === 0) {
        // Always return a new object
        return [];
    }

    return arr.slice(0, arr.length - 1);
};

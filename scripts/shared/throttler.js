'use strict';

module.exports = function(msdelay, fn) {
    var id;
    return function() {
        if (id) {
            clearTimeout(id);
        }
        id = setTimeout(function() {
            fn();
        }, msdelay);
    };
};

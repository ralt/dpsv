'use strict';

module.exports = function(str) {
    var strings = str.match(/%s/g);

    if (strings.length === 0) {
        if (arguments.length === 1) {
            return str;
        }
        if (arguments.length > 1) {
            throw new Error('Too many arguments.');
        }
    }

    var ret = str;
    for (var i = 1; i < arguments.length; i++) {
        ret = ret.replace('%s', arguments[i]);
    }
    return ret;
};

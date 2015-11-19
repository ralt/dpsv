'use strict';

if (!Array.prototype.find) {
    Array.prototype.find = function(cb) {
        for (let i = 0; i < this.length; i++) {
            if (cb(this[i])) {
                return this[i];
            }
        }
    };
}

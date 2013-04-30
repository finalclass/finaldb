/*jslint node:true*/
'use strict';
var when = require('when'),
    path = require('path'),
    ffs = require('final-fs');

/**
 * @param {Collection} fdbCollection
 */
module.exports = function (fdbCollection) {
    this.fdbCollection = fdbCollection;
    this.execute = this.execute.bind(this);
};

module.exports.prototype = Object.create(null, {
    execute: {
        writable: true,
        value: function () {
            var dir = this.fdbCollection.dirName;

            return ffs.mkdirRecursive(dir);
        }
    }
});
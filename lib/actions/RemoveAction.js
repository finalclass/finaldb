/*jslint node:true*/
'use strict';
var Action = require('./Action.js'),
    path = require('path'),
    ffs = require('final-fs'),
    fs = require('fs'),
    when = require('when');

module.exports = function (entity, dir) {
    Action.call(this, 'remove', entity, dir);
};

module.exports.prototype = Object.create(Action.prototype, {
    execute: {
        value: function () {
            var dirPath = path.resolve(this.dir, this.entity.id);

            return ffs.unlink(dirPath + '.json').then(function () {
                return ffs.rmdirRecursive(dirPath);
            }).otherwise(function (err) {
                return true; //if dir does not exists
            });
        }
    }
});
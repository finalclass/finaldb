/*jslint node:true*/
'use strict';
var path = require('path'),
    ffs = require('final-fs'),
    extend = require('extend'),
    when = require('when');

module.exports = function (entity, dir) {
    this.entity = extend({}, entity);
    this.dir = dir;
};

module.exports.prototype = Object.create(null, {
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
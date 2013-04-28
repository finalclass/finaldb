/*jslint node:true*/
'use strict';
var when = require('when'),
    ffs = require('final-fs'),
    path = require('path'),
    extend = require('extend'),
    generateUniqueId = require('../generateUniqueId.js');

module.exports = function (entity, dir) {
    this.entity = extend({}, entity);
    this.dir = dir;

    entity.rev = generateUniqueId();
};

module.exports.prototype = Object.create(null, {
    execute: {
        value: function () {
            var entity = this.entity,
                filePath = this.dir + '/' + entity.id + '.json',
                backupFilePath = path.resolve(this.dir, entity.id, entity.rev + '.json'),
                dirName = path.resolve(this.dir, entity.id);

            return ffs.mkdir(dirName)
                .then(function () {
                    return ffs.rename(filePath, backupFilePath);
                })
                .then(function () {
                    return ffs.writeJSON(filePath, entity);
                });
        }
    }
});
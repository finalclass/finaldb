/*jslint node:true*/
'use strict';
var Action = require('./Action.js'),
    when = require('when'),
    fs = require('fs'),
    ffs = require('final-fs'),
    path = require('path'),
    generateUniqueId = require('../generateUniqueId.js');

module.exports = function (entity, dir) {
    Action.call(this, 'update', entity, dir);
    entity.rev = generateUniqueId();
};

module.exports.prototype = Object.create(Action.prototype, {
    execute: {
        value: function () {
            var entity = this.entity,
                filePath = this.dir + '/' + entity.id + '.json',
                backupFilePath = path.resolve(this.dir, entity.id, entity.rev + '.json'),
                dirName = path.resolve(this.dir, entity.id);

            return ffs.createDirIfNotExists(dirName)
                .then(function () {
                    return ffs.rename(filePath, backupFilePath);
                })
                .then(function () {
                    return ffs.writeJSON(filePath, entity);
                });
        }
    }
});
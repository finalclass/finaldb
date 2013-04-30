/*jslint node:true*/
'use strict';
var when = require('when'),
    ffs = require('final-fs'),
    path = require('path'),
    finders = require('../finders.js'),
    extend = require('extend'),
    mapper = require('../mapper.js'),
    sequence = require('when/sequence'),
    generateUniqueId = require('../generateUniqueId.js');

module.exports = function (entity, fdbCollection) {
    this.entity = extend({}, entity);
    this.fdbCollection = fdbCollection;

    entity.rev = generateUniqueId();
};

module.exports.prototype = Object.create(null, {
    execute: {
        value: function () {
            var dir = this.fdbCollection.dirName,
                maps = this.fdbCollection.maps,
                entity = this.entity,
                oldEntity,
                filePath = dir + '/' + entity.id + '.json',
                backupFilePath = path.resolve(dir, entity.id, entity.rev + '.json'),
                dirName = path.resolve(dir, entity.id);

            return finders.byId(dir, entity.id) //find old
                .then(function (result) {
                    oldEntity = result;
                    return ffs.mkdir(dirName);
                })
                .then(function () {
                    return ffs.rename(filePath, backupFilePath);
                })
                .then(function () {
                    return ffs.writeJSON(filePath, entity);
                })
                .then(function () { //find old
                    return finders.byId(dir, entity.id);
                })
                .then(function () {
                    return sequence([
                        function () {
                            return mapper.removeObjectFromMaps(dir, maps, oldEntity);
                        },
                        function () {
                            return mapper.insertObjectToMaps(dir, maps, entity);
                        }
                    ]);
                });
        }
    }
});
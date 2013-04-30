/*jslint node:true*/
'use strict';
var when = require('when'),
    path = require('path'),
    extend = require('extend'),
    ffs = require('final-fs'),
    mapper = require('../mapper.js'),
    generateUniqueId = require('../generateUniqueId.js');

/**
 * @param {Object} entity
 * @param {Collection} fdbCollection
 */
module.exports = function (entity, fdbCollection) {
    entity.id = generateUniqueId();
    entity.rev = generateUniqueId();

    this.fdbCollection = fdbCollection;
    this.entity = extend({}, entity);
};

module.exports.prototype = Object.create(null, {
    execute: {
        value: function () {
            var maps = this.fdbCollection.maps,
                dir = this.fdbCollection.dirName,
                entity = this.entity,
                filePath = path.resolve(dir, entity.id + '.json');

            return ffs.writeJSON(filePath, this.entity)
                .then(function () {
                    return mapper.insertObjectToMaps(dir, maps, entity);
                });
        }
    }
});
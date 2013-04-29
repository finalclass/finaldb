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
 * @param {string} dir
 * @param {Object} maps
 */
module.exports = function (entity, dir, maps) {
    entity.id = generateUniqueId();
    entity.rev = generateUniqueId();

    this.entity = extend({}, entity);
    this.dir = dir;
    this.maps = maps;
};

module.exports.prototype = Object.create(null, {
    execute: {
        value: function () {
            var maps = this.maps,
                dir = this.dir,
                entity = this.entity,
                filePath = path.resolve(dir, entity.id + '.json');

            return ffs.writeJSON(filePath, this.entity)
                .then(function () {
                    return mapper.insertObjectToMaps(dir, maps, entity);
                });
        }
    }
});
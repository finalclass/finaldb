/*jslint node:true*/
'use strict';
var path = require('path'),
    ffs = require('final-fs'),
    extend = require('extend'),
    mapper = require('../mapper.js'),
    when = require('when');

module.exports = function (entity, dir, maps) {
    this.entity = extend({}, entity);
    this.dir = dir;
    this.maps = maps;
};

module.exports.prototype = Object.create(null, {
    execute: {
        value: function () {
            var maps = this.maps,
                entity = this.entity,
                dir = this.dir,
                dirPath = path.resolve(dir, entity.id);

            return ffs.unlink(dirPath + '.json')
                .then(function () {
                    return ffs.rmdirRecursive(dirPath);
                })
                .otherwise(function () {
                    return true; //if dir does not exists
                })
                .then(function () { //rebuild map
                    return mapper.removeObjectFromMaps(dir, maps, entity);
                });
        }
    }
});
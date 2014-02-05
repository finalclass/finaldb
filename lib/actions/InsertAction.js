/*jslint node:true*/
'use strict';
var extend = require('extend');
var ffs = require('final-fs');
var mapper = require('../mapper.js');
var utils = require('../utils.js');
var paths = require('../paths.js');

/**
 * @param {Object} entity
 * @param {Collection} fdbCollection
 */
module.exports = function (entity, fdbCollection) {
  entity.rev = utils.generateUniqueId();
  entity.id = entity.id || utils.generateUniqueId();
  entity.id = entity.id.toString();
  entity.createdAt = new Date().getTime();
  entity.updatedAt = entity.createdAt;

  this.fdbCollection = fdbCollection;
  this.entity = extend({}, entity);
};

module.exports.prototype = Object.create(null, {
  execute: {
    value: function () {
      var maps = this.fdbCollection.maps,
        dir = this.fdbCollection.dirName,
        entity = this.entity,
        documentPath = paths.documentPath(dir, entity.id),
        documentDir = paths.documentDir(dir, entity.id);

      return ffs.mkdirRecursive(documentDir, 0x1e0) //1e0 = 0740
        .then(function () {
          return ffs.writeJSON(documentPath, entity);
        })
        .then(function () {
          return mapper.insertObjectToMaps(dir, maps, entity);
        });
    }
  }
});
/*jslint node:true*/
'use strict';
var when = require('when');
var ffs = require('final-fs');
var paths = require('../paths.js');
var finders = require('../finders.js');
var extend = require('extend');
var mapper = require('../mapper.js');
var utils = require('../utils.js');

module.exports = function (entity, fdbCollection) {
  entity.updatedAt = new Date().getTime();
  entity.rev = utils.generateUniqueId();
  this.entity = extend({}, entity);
  this.entity.id = this.entity.id.toString();
  this.fdbCollection = fdbCollection;
};

module.exports.prototype = Object.create(null, {
  execute: {
    value: function () {
      var dir = this.fdbCollection.dirName,
        storeRevisions = this.fdbCollection.storeRevisions,
        maps = this.fdbCollection.maps,
        entity = this.entity,
        oldEntity,
        documentPath = paths.documentPath(dir, entity.id);

      return finders.byId(dir, entity.id) //find old
        .then(function (result) {
          oldEntity = result;

          // The `createdAt` field should be inherited by default.
          if (!entity.createdAt && oldEntity.createdAt) {
            entity.createdAt = oldEntity.createdAt;
          }

          if (storeRevisions) {
            return ffs.mkdirRecursive(paths.revisionDir(dir, oldEntity.id, oldEntity.rev), 0x1e0 /*0740*/);
          }
        })
        .then(function () {
          if (storeRevisions) {
            return ffs.rename(documentPath, paths.revisionPath(dir, oldEntity.id, oldEntity.rev));
          }
        })
        .then(function () {
          return ffs.writeJSON(documentPath, entity);
        })
        .then(function () {
          return mapper.removeObjectFromMaps(dir, maps, oldEntity);
        })
        .then(function () {
          return mapper.insertObjectToMaps(dir, maps, entity);
        });
    }
  }
});
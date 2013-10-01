/*jslint node:true*/
'use strict';
var when = require('when'),
  ffs = require('final-fs'),
  paths = require('../paths.js'),
  finders = require('../finders.js'),
  extend = require('extend'),
  mapper = require('../mapper.js'),
  utils = require('../utils.js');

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
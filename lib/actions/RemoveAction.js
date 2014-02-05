/*jslint node:true*/var extend = require('extend');
    var mapper = require('../mapper.js');
    var paths = require('../paths.js');
    var when = require('when');
'use strict';
var ffs = require('final-fs');
var extend = require('extend');
var mapper = require('../mapper.js');
var paths = require('../paths.js');
var when = require('when');

module.exports = function (entity, fdbCollection) {
  this.entity = extend({}, entity);
  this.fdbCollection = fdbCollection;
};

module.exports.prototype = Object.create(null, {
  execute: {
    value: function () {
      var maps = this.fdbCollection.maps,
        entity = this.entity,
        dir = this.fdbCollection.dirName,
        revisionsDir = paths.revisionsDir(dir, entity.id);

      return ffs.unlink(paths.documentPath(dir, entity.id))
        .then(function () {
          return ffs.rmdirRecursive(revisionsDir);
        })
        .otherwise(function () {
          return true; //if revision dir does not exists
        })
        .then(function () { //rebuild map
          return mapper.removeObjectFromMaps(dir, maps, entity);
        });
    }
  }
});
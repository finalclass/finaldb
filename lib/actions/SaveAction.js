/*jslint node:true*/
'use strict';
var InsertAction = require('./InsertAction.js');
var UpdateAction = require('./UpdateAction');
var finders = require('../finders.js');
var extend = require('extend');
var utils = require('../utils.js');

/**
 * @param {Object} entity
 * @param {Collection} fdbCollection
 */
module.exports = function (entity, fdbCollection) {
  entity.id = entity.id || utils.generateUniqueId();
  entity.rev = utils.generateUniqueId();

  this.fdbCollection = fdbCollection;
  this.entity = extend({}, entity);
};

module.exports.prototype = Object.create(null, {
  execute: {
    value: function () {
      var entity = this.entity,
        fdbCollection = this.fdbCollection;

      return finders.byId(fdbCollection.dirName, entity.id)
        .then(function () {
          return new UpdateAction(entity, fdbCollection).execute();
        })
        .otherwise(function () {
          return new InsertAction(entity, fdbCollection).execute();
        });
    }
  }
});
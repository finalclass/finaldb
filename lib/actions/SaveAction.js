/*jslint node:true*/
'use strict';
var InsertAction = require('./InsertAction.js'),
    UpdateAction = require('./UpdateAction'),
    finders = require('../finders.js'),
    extend = require('extend'),
    generateUniqueId = require('../generateUniqueId.js');

/**
 * @param {Object} entity
 * @param {Collection} fdbCollection
 */
module.exports = function (entity, fdbCollection) {
    entity.id = entity.id || generateUniqueId();
    entity.rev = generateUniqueId();

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
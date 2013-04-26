/*jslint node:true*/
'use strict';
var Action = require('./Action.js'),
    when = require('when'),
    path = require('path'),
    fs = require('fs'),
    ffs = require('final-fs'),
    generateUniqueId = require('../generateUniqueId.js');


/**
 * @extends Action
 * @param entity
 * @param dir
 */
module.exports = function (entity, dir) {
    entity.id = generateUniqueId();
    entity.rev = generateUniqueId();
    Action.call(this, 'insert', entity, dir);
};

module.exports.prototype = Object.create(Action.prototype, {
    execute: {
        value: function () {
            var filePath = path.resolve(this.dir, this.entity.id + '.json');

            return ffs.writeJSON(filePath, this.entity);
        }
    }
});
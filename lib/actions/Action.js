/*jslint node:true*/
'use strict';

var extend = require('extend');

module.exports = function (type, entity, dir) {
    this.type = type;
    this.entity = extend({}, entity);
    this.dir = dir;
};
/*jslint node:true*/
'use strict';

module.exports = function (obj1, obj2) {
  var p, prop, keys = Object.keys(obj1), out = {};

  for (p = 0; p < keys.length; p += 1) {
    prop = keys[p];
    out[prop] = obj1[prop] || obj2[prop];
  }

  return obj1;
};
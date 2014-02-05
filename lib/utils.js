/*jshint node:true, bitwise:true*/
'use strict';

/**
 * Clears the entity from unwanted values leaving only wanted values specified in wantedValuesArray
 *
 * @param {object} entity
 * @param {array} wantedValuesArray
 * @returns {object}
 */
exports.sanitize = function (entity, wantedValuesArray) {
  var prop;

  for (prop in entity) {
    if (wantedValuesArray.indexOf(prop) === -1) {
      delete entity[prop];
    }
  }

  return entity;
};

/**
 * Generates unique id
 *
 * first 6 digits are random, and the rest is current date (in milliseconds) in 36 system
 *
 * @returns {string}
 */
exports.generateUniqueId = function () {
  return Math.round(Math.random() * 1e8).toString(36) + (+new Date()).toString(36);
};

/**
 * Generates hash code from string
 *
 * @param {string} [text='']
 * @param {int} [radix=36] number system to be used in converting int hash to string
 * @returns {string}
 */
exports.hashCode = function (text, radix) {
  var hash = 0,
    len,
    hashString,
    i,
    chr;

  text = text || '';
  text = text.toString();
  len = text.length;

  for (i = 0; i < len; i += 1) {
    chr = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash = hash & hash; // Convert to 32bit integer
  }

  //Convert to string with minimum 4 letters
  hashString = Math.abs(hash).toString(radix || 36);

  while (hashString.length < 4) {
    hashString = '0' + hashString;
  }

  return hashString;
};
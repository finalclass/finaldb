/*jslint node:true*/
'use strict';

var ffs = require('final-fs');
var when = require('when');
var sequence = require('when/sequence');
var path = require('path');
var paths = require('./paths.js');

exports.all = function (rootDir) {
  return exports.eachSequence(rootDir, function (file) {
    if (file instanceof Object) {
      return file;
    }
  });
};

exports.byIds = function (rootDir, idsArray) {
  var tasks = idsArray.map(function (id) {
    return function () {
      return ffs.readJSON(paths.documentPath(rootDir, id))
        .otherwise(function () {/*ignore*/});
    };
  });

  return sequence(tasks).then(function (result) {
      return result.filter(function (item) {
        return item !== undefined;
      });
    });
};

exports.byId = function (rootDir, id) {
  return ffs.readJSON(paths.documentPath(rootDir, id))
    .otherwise(function () {
      throw new Error('not_found');
    });
};

exports.byMap = function (rootDir, mapName, key) {
  var mapValuesDir;

  if (key instanceof Array) {
    key = key.join('-');
  }

  mapValuesDir = paths.mapValuesDir(rootDir, mapName, key);

  return ffs.readdirRecursive(mapValuesDir, true, mapValuesDir)
    .then(function (files) {
      return sequence(files.map(function (file) {
        return function () {
          return ffs.readJSON(file);
        };
      }));
    })
    .otherwise(function (err) {
      if (err.code === 'ENOENT') {
        return [];
      } else {
        throw err;
      }
    });
};

exports.each = function (rootDir, func) {
  return ffs.readdirRecursive(rootDir, true)
    .then(function (files) {
      return when.map(files, function (file) {
        return ffs.readJSON(path.resolve(rootDir, file))
          .then(func);
      });
    });
};

exports.eachSequence = function (rootDir, func) {
  var documentsDir = paths.documentsDir(rootDir);
  return ffs.readdirRecursive(documentsDir, true, documentsDir)
    .then(function (files) {
      var functions = files.map(function (file) {
        return function () {
          return ffs.readJSON(path.resolve(rootDir, file)).then(func);
        };
      });
      return sequence(functions);
    })
    .otherwise(function (err) {
      if (err.errno === 34) {
        return [];
      } else {
        console.error(err.stack);
        throw err;
      }
    })
};
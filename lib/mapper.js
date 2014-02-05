/*jslint node:true*/
'use strict';

var ffs = require('final-fs');
var path = require('path');
var when = require('when');
var sequence = require('when/sequence');
var paths = require('./paths.js');
var finders = require('./finders.js');

exports.map = function (rootDir, mapName, func) {
  var mapDir = paths.mapDir(rootDir, mapName);
  var mapPath = paths.mapPath(rootDir, mapName);

  return ffs.exists(mapDir)
    .then(function (exists) {
      if (!exists) {
        return ffs.mkdirRecursive(mapDir, 0x1e0 /*0740*/);
      }
    })
    .then(function () {
      return ffs.exists(mapPath);
    })
    .then(function (exists) {
      if (exists) {
        return ffs.readFile(mapPath, {encoding: 'utf-8'});
      }
      return '';
    })
    .then(function (oldMapContents) {
      var funcString = func.toString();

      if (oldMapContents.toString() !== funcString) {
        return exports.rebuildMap(rootDir, mapName, func)
          .then(function () {
            return ffs.writeFile(mapPath, funcString, {encoding: 'utf-8'});
          });
      }
    });
};

exports.rebuildMap = function (rootDir, mapName, func) {
  var mapDir = paths.mapDir(rootDir, mapName);

  return ffs.exists(mapDir)
    .then(function (exists) {
      if (exists) {
        return ffs.rmdirRecursive(mapDir);
      }
    })
    .then(function () {
      return ffs.mkdirRecursive(mapDir, 0x1e0 /*=0740*/);
    })
    .then(function () {
      return finders.eachSequence(rootDir, function (obj) {
        return exports.mapObject(rootDir, mapName, func, obj);
      });
    });
};

exports.mapObject = function (rootDir, mapName, mapFunction, obj) {
  var kvPairs = [],
    emit = function (key, value) {
      if (key instanceof Array) {
        key = key.join('-');
      }
      kvPairs.push([key, value]);
    };

  mapFunction(emit, obj);

  return when.map(kvPairs, function (kvPair) {
    var emittedKey = kvPair[0],
      emittedValue = kvPair[1],
      mapDocumentValuesDir = paths.mapDocumentValuesDir(rootDir, mapName, emittedKey, obj.id);

    return ffs.mkdirRecursive(mapDocumentValuesDir, 0x1e0 /*=0740*/)
      .then(function () {
        return ffs.readdir(mapDocumentValuesDir);
      })
      .then(function (files) {
        return ffs.writeJSON(
          path.resolve(mapDocumentValuesDir, files.length + '.json'),
          emittedValue
        );
      });
  });
};

exports.removeObjectFromMap = function (rootDir, mapName, mapFunction, obj) {
  var kvPairs = [],
    emit = function (key, value) {
      kvPairs.push([key, value]);
    };

  mapFunction(emit, obj);

  return when.map(kvPairs, function (kvPair) {
    return ffs.rmdirRecursive(paths.mapDocumentValuesDir(rootDir, mapName, kvPair[0], obj.id));
  });
};

exports.removeObjectFromMaps = function (rootDir, allMaps, obj) {
  var mapName, promises = [];

  for (mapName in allMaps) {
    if (allMaps.hasOwnProperty(mapName)) {
      promises.push(
        exports.removeObjectFromMap(rootDir, mapName, allMaps[mapName], obj)
      );
    }
  }

  return when.all(promises);
};

exports.insertObjectToMaps = function (rootDir, allMaps, obj) {
  var functions = [];

  Object.keys(allMaps).forEach(function forEachMap(mapName) {
    functions.push(function () {
      return exports.mapObject(rootDir, mapName, allMaps[mapName], obj);
    });
  });

  return sequence(functions);
};
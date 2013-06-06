/*jslint node:true*/
'use strict';

var ffs = require('final-fs'),
    path = require('path'),
    when = require('when'),
    paths = require('./paths.js'),
    finders = require('./finders.js');

exports.map = function (rootDir, mapName, func) {
    var mapDir, mapPath;

    mapDir = paths.mapDir(rootDir, mapName);
    mapPath = paths.mapPath(rootDir, mapName);

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

exports.find = function (rootDir, mapName, key) {
    var mapValuesDir = paths.mapValuesDir(rootDir, mapName, key);

    return ffs.readdirRecursive(mapValuesDir, true, mapValuesDir)
        .then(function (files) {
            if (!(files instanceof Array) || files.length === 0) {
                return [];
            }

            return when.map(files, function (file) {
                return ffs.readJSON(file);
            });
        });
};

exports.indexOf = function (array, obj) {
    var str = JSON.stringify(obj),
        i;

    for (i = 0; i < array.length; i += 1) {
        if (JSON.stringify(array[i]) === str) {
            return i;
        }
    }

    return -1;
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
    var promises = [];

    for (var mapName in allMaps) {
        if (allMaps.hasOwnProperty(mapName)) {
            promises.push(
                exports.mapObject(rootDir, mapName, allMaps[mapName], obj)
            );
        }
    }

    return when.all(promises);
};
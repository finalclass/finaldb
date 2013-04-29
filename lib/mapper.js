/*jslint node:true*/
'use strict';

var ffs = require('final-fs'),
    path = require('path'),
    when = require('when'),
    finders = require('./finders.js');


exports.buildEmitFunction = function (dir, deferred) {
    return function (key, value) {
        var filePath = path.resolve(dir, ffs.fileNameFilter(key) + '.json'),
            promise;

        promise = ffs.readJSON(filePath)
            .then(function (arr) {
                return arr;
            }, function (err) {
                return [];
            })
            .then(function (arr) {
                arr.push(value);
                return ffs.writeJSON(filePath, arr);
            });


        deferred.resolve(promise);
    };
};

exports.map = function (collectionDirPath, mapName, func) {
    var mapDirPath, mapFilePath;

    mapName = ffs.fileNameFilter(mapName);
    mapDirPath = path.resolve(collectionDirPath, '__maps', mapName);
    mapFilePath = path.resolve(collectionDirPath, '__maps', mapName + '.js');

    return ffs.exists(mapDirPath)
        .then(function (exists) {
            if (!exists) {
                return ffs.mkdirRecursive(mapDirPath);
            }
        })
        .then(function () {
            return ffs.exists(mapFilePath);
        })
        .then(function (exists) {
            if (exists) {
                return ffs.readFile(mapFilePath, {encoding: 'utf-8'});
            }
            return '';
        })
        .then(function (oldMapContents) {
            var funcString = func.toString();

            if (oldMapContents !== funcString) {
                return exports.rebuildMap(collectionDirPath, mapDirPath, mapName, func)
                    .then(function () {
                        return ffs.writeFile(mapFilePath, funcString, {encoding: 'utf-8'});
                    });
            }
        });
};

exports.rebuildMap = function (collectionDirPath, mapDirPath, mapName, func) {
    return ffs.exists(mapDirPath)
        .then(function (exists) {
            if (exists) {
                return ffs.rmdirRecursive(mapDirPath);
            }
        })
        .then(function () {
            return ffs.mkdirRecursive(mapDirPath);
        })
        .then(function () {
            return finders.eachSequence(collectionDirPath, function (obj) {
                return exports.mapObject(collectionDirPath, mapName, func, obj);
            });
        });
};

exports.mapObject = function (collectionDirPath, mapName, mapFunction, obj) {
    var mapDirPath, defer;

    mapName = ffs.fileNameFilter(mapName);
    mapDirPath = path.resolve(collectionDirPath, '__maps', mapName);
    defer = when.defer();
    mapFunction(exports.buildEmitFunction(mapDirPath, defer), obj);
    return defer.promise;
};

exports.find = function (dir, mapName, keyValue) {
    keyValue = ffs.fileNameFilter(keyValue);
    mapName = ffs.fileNameFilter(mapName);
    return ffs.readJSON(path.resolve(dir, '__maps', mapName, keyValue + '.json'));
};

exports.removeObjectFromMap = function (collectionDirPath, mapName, mapFunction, obj) {
    var defer = when.defer();

    mapName = ffs.fileNameFilter(mapName);

    mapFunction(function (key, value) { //this is emit function
        var filePath;

        key = ffs.fileNameFilter(key);
        filePath = path.resolve(collectionDirPath, '__maps', mapName, key + '.json');

        ffs.readJSON(filePath)
            .then(function (values) {
                var index = values.indexOf(value);

                values.splice(index, 1);
                return ffs.writeJSON(filePath, values);
            })
            .then(function () {
                defer.resolve();
            })
            .otherwise(function (err) {
                defer.reject(err);
            });

    }, obj);

    return defer.promise;
};

exports.removeObjectFromMaps = function (dir, maps, obj) {
    var mapName, promises = [];

    for (mapName in maps) {
        if (maps.hasOwnProperty(mapName)) {
            promises.push(
                exports.removeObjectFromMap(dir, mapName, maps[mapName], obj)
            );
        }
    }

    return when.all(promises);
};

exports.insertObjectToMaps = function (dir, maps, obj) {
    var promises = [];

    for (var mapName in maps) {
        if (maps.hasOwnProperty(mapName)) {
            promises.push(
                exports.mapObject(dir, mapName, maps[mapName], obj)
            );
        }
    }

    return when.all(promises);
};
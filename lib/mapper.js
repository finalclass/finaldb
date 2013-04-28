/*jslint node:true*/
'use strict';

var ffs = require('final-fs'),
    path = require('path'),
    when = require('when'),
    finders = require('./finders.js');


exports.buildEmitFunction = function (dir, mapName, deferred) {
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
                return ffs.writeFile(mapFilePath, funcString, {encoding: 'utf-8'})
                    .then(function () {
                        return exports.rebuildMap(collectionDirPath, mapDirPath, mapName, func);
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
    var mapDirPath = path.resolve(collectionDirPath, '__maps', mapName);
    var deffered = when.defer();
    mapFunction(exports.buildEmitFunction(mapDirPath, mapName, deffered), obj);
    return deffered.promise;
};

exports.find = function (dir, mapName, keyValue) {
    keyValue = ffs.fileNameFilter(keyValue);
    return ffs.readJSON(path.resolve(dir, '__maps', mapName, keyValue + '.json'));
};
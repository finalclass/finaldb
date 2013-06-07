/*jslint node:true*/
'use strict';

var ffs = require('final-fs'),
    when = require('when'),
    sequence = require('when/sequence'),
    path = require('path'),
    paths = require('./paths.js');

exports.all = function (rootDir) {
    return exports.eachSequence(rootDir, function (file) {
        if (file instanceof Object) {
            return file;
        }
    });
};

exports.byId = function (rootDir, id) {
    return ffs.readJSON(paths.documentPath(rootDir, id))
        .otherwise(function () {
            throw new Error('not_found');
        });
};

exports.byMap = function (rootDir, mapName, key) {
    var mapValuesDir = paths.mapValuesDir(rootDir, mapName, key);

    return ffs.readdirRecursive(mapValuesDir, true, mapValuesDir)
        .then(function (files) {
            return sequence(files.map(function (file) {
                return function () {
                    return ffs.readJSON(file);
                };
            }));
        });
};

exports.each = function(rootDir, func) {
    return ffs.readdirRecursive(rootDir, true)
        .then(function (files) {
            return when.map(files, function (file) {
                return ffs.readJSON(path.resolve(rootDir, file))
                    .then(func);
            });
        });
};

exports.eachSequence = function(rootDir, func) {
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
            console.log('niespodzianka');
            console.log(err.stack);
        })
};
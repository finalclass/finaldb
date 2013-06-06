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
    return ffs.readdirRecursive(rootDir, true)
        .then(function (files) {
            var functions = files.map(function (file) {
                return function () {
                    return ffs.readJSON(path.resolve(rootDir, file)).then(func);
                };
            });
            return sequence(functions);
        });
};
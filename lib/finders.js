/*jslint node:true*/
'use strict';

var ffs = require('final-fs'),
    when = require('when'),
    path = require('path');

exports.all = function (dir) {
    return ffs.dirFiles(dir).then(function (files) {
        return when.map(files, function (fileName) {
            return ffs.readJSON(path.resolve(dir, fileName));
        });
    });
};

exports.byId = function (dir, id) {
    var filePath = path.resolve(dir, id + '.json');

    return ffs.readJSON(filePath).otherwise(function (err) {
        var exception = new Error('Record not found');

        exception.message = 'Record with id ' + id + ' cannot be found';
        throw exception;
    });
};
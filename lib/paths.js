/*jshint node:true*/
'use strict';

var path = require('path'),
    ffs = require('final-fs'),
    utils = require('./utils.js');

exports.documentsDir = function (rootDir) {
    return path.resolve(rootDir, 'data');
};

exports.rootMapsDir = function (rootDir) {
    return path.resolve(rootDir, 'maps');
};

exports.revisionsRootDir = function (rootDir) {
    return path.resolve(rootDir, 'revisions');
};

exports.lockFilePath = function (rootDir) {
    return path.resolve(rootDir, 'lock');
};

exports.documentDir = function (rootDir, documentId) {
    var hash = utils.hashCode(documentId);

    return path.resolve(
        exports.documentsDir(rootDir),
        hash.substr(0, 2),
        hash.substr(2, 2)
    );
};

exports.documentPath = function (rootDir, documentId) {
    return path.resolve(
        exports.documentDir(rootDir, documentId),
        documentId + '.json'
    );
};

exports.mapDir = function (rootDir, mapName) {
    return path.resolve(exports.rootMapsDir(rootDir), ffs.fileNameFilter(mapName));
};

exports.mapPath = function (rootDir, mapName) {
    return path.resolve(exports.rootMapsDir(rootDir), ffs.fileNameFilter(mapName) + '.js');
};

exports.mapValuesDir = function (rootDir, mapName, key) {
    var kvHash = utils.hashCode(key);

    return path.resolve(
        exports.mapDir(rootDir, mapName),
        kvHash.substr(0, 2),
        kvHash.substr(2, 2),
        ffs.fileNameFilter(key)
    );
};

exports.mapDocumentValuesDir = function (rootDir, mapName, key, id) {
    var idHash = utils.hashCode(id);

    return path.resolve(
        exports.mapValuesDir(rootDir, mapName, key),
        idHash.substr(0, 2),
        idHash.substr(2, 2),
        ffs.fileNameFilter(id)
    );
};

exports.revisionsDir = function (rootDir, documentId) {
    var docIdHash = utils.hashCode(documentId);

    return path.resolve(
        exports.revisionsRootDir(rootDir),
        docIdHash.substr(0, 2),
        docIdHash.substr(2, 2),
        documentId
    );
};

exports.revisionDir = function (rootDir, documentId, revision) {
    var revHash = utils.hashCode(revision);

    return path.resolve(
        exports.revisionsDir(rootDir, documentId),
        revHash.substr(0, 2),
        revHash.substr(2, 2)
    );
};

exports.revisionPath = function (rootDir, documentId, revision) {
    return path.resolve(
        exports.revisionDir(rootDir, documentId, revision),
        documentId + '.json'
    );
};
/*jshint node:true*/
'use strict';

var lockfile = require('lockfile'),
    resolve = require('path').resolve,
    when = require('when');


/**
 * @param {string|Array} filePath
 * @param {{wait, stale, retries, retryWait}} opts
 * @returns {when.Promise}
 */
exports.lock = function (filePath, opts) {
    var defer = when.defer();
    if (filePath instanceof Array) {
        filePath = resolve.apply(undefined, filePath);
    }

    lockfile.lock(filePath, opts, function (err) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve();
        }
    });

    return defer.promise;
};

/**
 * @param {string|Array} filePath
 * @param {{wait, stale, retries, retryWait}} opts
 * @returns {undefined}
 */
exports.lockSync = function (filePath, opts) {
    if (filePath instanceof Array) {
        filePath = resolve.apply(undefined, filePath);
    }

    return lockfile.lockSync(filePath, opts);
};

/**
 * @param {string|Array} filePath
 * @returns {when.Promise}
 */
exports.unlock = function (filePath) {
    var defer = when.defer();

    if (filePath instanceof Array) {
        filePath = resolve.apply(undefined, filePath);
    }

    lockfile.unlock(filePath, function (err) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve();
        }
    });

    return defer.promise;
};

/**
 * @param {string|Array} filePath
 * @returns {undefined}
 */
exports.unlockSync = function (filePath) {
    if (filePath instanceof Array) {
        filePath = resolve.apply(undefined, filePath);
    }

    return lockfile.unlockSync(filePath);
};

/**
 * @param {string|Array} filePath
 * @param {{stale}} opts
 * @returns {when.Promise}
 */
exports.check = function (filePath, opts) {
    var defer = when.defer();

    if (filePath instanceof Array) {
        filePath = resolve.apply(undefined, filePath);
    }

    lockfile.check(filePath, opts, function (err, isLocked) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve(isLocked);
        }
    });

    return defer.promise;
};

/**
 * @param {string|Array} filePath
 * @param {{stale}} opts
 * @returns {boolean}
 */
exports.checkSync = function (filePath, opts) {
    if (filePath instanceof Array) {
        filePath = resolve.apply(undefined, filePath);
    }

    return lockfile.checkSync(filePath, opts);
};
/*jslint node:true*/
/*global module*/
'use strict';

var extend = require('./extend.js'),
    EventEmitter = require('events').EventEmitter,
    crypto = require('crypto'),
    util = require('util'),
    when = require('when'),
    sequence = require('when/sequence'),
    fs = require('fs'),
    nfs = require('node-fs'),
    FinalClass = require('final-class'),
    path = require('path');

var Collection = module.exports = new FinalClass({
    className: 'finaldb_Collection',
    parents: [EventEmitter],
    descriptor: {
        finaldb_Collection: {
            value: function (options) {
                EventEmitter.call(this);
                this.options = options;
                this.entitiesNotStored = [];
            }
        },
        generateUniqueId: {
            value: function () {
                return crypto.createHash('md5')
                    .update((new Date().getTime() * Math.random()).toString())
                    .digest('hex');
            }
        },
        flush: {
            value: function (callback) {
                var promise,
                    sf = this.saveFile,
                    jobs = [this.createDirIfNotExists]
                        .concat(this.entitiesNotStored.map(function (entity) {
                            return function () {
                                return sf(entity);
                            };
                        }));

                promise = sequence(jobs);
                promise.then(this.clearNotStoredEntities);

                return this.wrapPromise(callback, promise);
            }
        },
        clearNotStoredEntities: {
            method: true,
            value: function () {
                this.entitiesNotStored = [];
            }
        },
        createDirIfNotExists: {
            method: true,
            value: function () {
                var deferred = when.defer();

                //1ff(hex) = 0777(oct)
                nfs.mkdir(this.options.dirName, 0x1ff, true, function (err) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve();
                    }
                });

                return deferred.promise;
            }
        },
        wrapPromise: {
            value: function (callback, promise) {
                if (callback instanceof Function) {
                    promise.then(function (data) { callback(null, data); }, callback);
                }
                return promise;
            }
        },
        saveFile: {
            method: true,
            value: function (entity) {
                var deferred = when.defer(),
                    filePath = path.resolve(this.options.dirName, entity.id + '.json');

                fs.writeFile(filePath, JSON.stringify(entity, null, '    '), function (err, result) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve(result);
                    }
                }.bind(this));

                return deferred.promise;
            }
        },
        persist: {
            value: function (entity, callback) {
                this.entitiesNotStored.push(entity);
                if (entity.id === undefined) {
                    entity.id = this.generateUniqueId();
                }
                return this;
            }
        },
        find: {
            value: function (query, callback) {
                if (typeof query === 'string') {
                    return this.findById(query, callback);
                }
            }
        },
        findById: {
            value: function (id, callback) {
                fs.readFile(this.options.dirname);
            }
        }
    }
});
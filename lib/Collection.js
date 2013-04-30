/*jslint node:true*/
'use strict';

var EventEmitter = require('events').EventEmitter,
    when = require('when'),
    sequence = require('when/sequence'),
    ffs = require('final-fs'),
    finders = require('./finders.js'),
    mapper = require('./mapper.js'),
    path = require('path'),
    ActionCollection = require('./actions/ActionCollection.js'),
    FinalClass = require('final-class');

module.exports = new FinalClass({
    className: 'finaldb_Collection',
    parents: [EventEmitter],
    descriptor: {
        finaldb_Collection: {
            value: function (argv) {
                EventEmitter.call(this);
                this.data = {
                    dirName: argv.dirName,
                    maps: {}
                };
                this.argv = argv;
                this.actions = new ActionCollection(this);
            }
        },
        maps: {
            get: function () {
                return this.data.maps;
            }
        },
        dirName: {
            get: function () {
                return this.data.dirName;
            }
        },
        createDirIfNotExists: {
            method: true,
            value: function () {
                return ffs.mkdirRecursive(this.argv.dirName);
            }
        },
        find: {
            value: function () {
                switch (arguments.length) {
                case 0:
                    return finders.all(this.argv.dirName);
                case 1:
                    return finders.byId(this.argv.dirName, arguments[0]);
                case 2:
                    return mapper.find(this.argv.dirName, arguments[0], arguments[1]);
                default:
                    throw new Error('Unsupported number of arguments');
                }
            }
        },
        map: {
            value: function (name, func) {
                this.maps[name] = func;
                return mapper.map(this.argv.dirName, name, func);
            }
        },
        insert: {
            value: function (entity) {
                this.actions.push('insert', entity);
                return this;
            }
        },
        update: {
            value: function (entity) {
                this.actions.push('update', entity);
                return this;
            }
        },
        remove: {
            value: function (entity) {
                this.actions.push('remove', entity);
                return this;
            }
        },
        flush: {
            value: function () {
                var jobs = [];

                this.actions.pushFront('init');

                this.actions.each(function (action) {
                    jobs.push(function () {
                        return action.execute();
                    });
                });

                this.actions.clear();
                return sequence(jobs);
            }
        }
    }
});
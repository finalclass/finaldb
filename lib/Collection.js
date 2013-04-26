/*jslint node:true*/
'use strict';

var EventEmitter = require('events').EventEmitter,
    fs = require('fs'),
    when = require('when'),
    sequence = require('when/sequence'),
    ffs = require('final-fs'),
    finders = require('./finders.js'),
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
                this.argv = argv;
                this.actions = new ActionCollection();
            }
        },
        createDirIfNotExists: {
            method: true,
            value: function () {
                return ffs.createDirIfNotExists(this.argv.dirName);
            }
        },
        find: {
            value: function (query) {
                var dir = this.argv.dirName,
                    queryType = typeof query;

                if (query === undefined) {
                    return finders.all(dir);
                }
                if (queryType === 'string' || queryType === 'number') {
                    return finders.byId(query);
                }
            }
        },
        insert: {
            value: function (entity) {
                this.actions.push('insert', entity, this.argv.dirName);
                return this;
            }
        },
        update: {
            value: function (entity) {
                this.actions.push('update', entity, this.argv.dirName);
                return this;
            }
        },
        remove: {
            value: function (entity) {
                this.actions.push('remove', entity, this.argv.dirName);
                return this;
            }
        },
        flush: {
            value: function () {
                var def = when.defer(),
                    jobs = [];

                jobs.push(this.createDirIfNotExists);
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
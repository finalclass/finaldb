/*jslint node:true*/
'use strict';

var sequence = require('when/sequence'),
    finders = require('./finders.js'),
    ffs = require('final-fs'),
    locker = require('./locker.js'),
    mapper = require('./mapper.js'),
    path = require('path'),
    utils = require('./utils.js'),
    ActionCollection = require('./actions/ActionCollection.js'),
    generateId = require('./generateUniqueId.js'),
    FinalClass = require('final-class');

module.exports = new FinalClass({
    className: 'finaldb_Collection',
    parents: [],
    descriptor: {
        finaldb_Collection: {
            value: function (argv) {
                this.actions = new ActionCollection(this);

                if (typeof argv === 'string' || argv instanceof Array) {
                    argv = {dirName: argv};
                }

                this.data = {
                    dirName: argv.dirName,
                    maps: {}
                };

                if (this.data.dirName instanceof Array) {
                    this.data.dirName = path.resolve.apply(this, this.data.dirName);
                }
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
        find: {
            value: function () {
                switch (arguments.length) {
                case 0:
                    return finders.all(this.dirName);
                case 1:
                    return finders.byId(this.dirName, arguments[0]);
                case 2:
                    return mapper.find(this.dirName, arguments[0], arguments[1]);
                default:
                    throw new Error('Unsupported number of arguments');
                }
            }
        },
        map: {
            value: function (name, func) {
                this.maps[name] = func;
                return mapper.map(this.dirName, name, func);
            }
        },
        sanitize: {
            value: function (entity, wantedValuesArray) {
                utils.sanitize(entity, wantedValuesArray);
                return this;
            }
        },
        generateId: {
            value: function () {
                return generateId();
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
        save: {
            value: function (entity) {
                this.actions.push('save', entity);
                return this;
            }
        },
        flush: {
            value: function () {
                var jobs = [],
                    dir = this.dirName;

                jobs.push(function () { //mkdir if dir does not exists
                    return ffs.mkdirRecursive(dir);
                });

                jobs.push(function () { //lock collection
                    locker.lock([dir, 'lock'], {wait: 1000, retryWait: 5});
                });

                //convert all actions into array of functions
                this.actions.each(function (action) {
                    jobs.push(function () {
                        return action.execute();
                    });
                });
                this.actions.clear();

                return sequence(jobs) //run all jobs
                    .ensure(function () { //make sure to unlock collection
                        return locker.unlock([dir, 'lock']);
                    });
            }
        }
    }
});
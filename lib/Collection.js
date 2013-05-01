/*jslint node:true*/
'use strict';

var EventEmitter = require('events').EventEmitter,
    sequence = require('when/sequence'),
    finders = require('./finders.js'),
    mapper = require('./mapper.js'),
    path = require('path'),
    utils = require('./utils.js'),
    ActionCollection = require('./actions/ActionCollection.js'),
    FinalClass = require('final-class');

module.exports = new FinalClass({
    className: 'finaldb_Collection',
    parents: [EventEmitter],
    descriptor: {
        finaldb_Collection: {
            value: function (argv) {
                EventEmitter.call(this);

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
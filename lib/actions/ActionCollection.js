/*jslint node:true*/
'use strict';

var FinalClass = require('final-class'),
    InsertAction = require('./InsertAction.js'),
    UpdateAction = require('./UpdateAction.js'),
    RemoveAction = require('./RemoveAction.js');

module.exports = new FinalClass({
    className: 'finaldb_ActionCollection',
    parents: [],
    descriptor: {
        finaldb_ActionCollection: {
            value: function (collection) {
                this.fdbCollection = collection;
                this.actions = [];
            }
        },
        clear: {
            value: function () {
                this.actions = [];
            }
        },
        push: {
            value: function (type, entity) {
                var action;

                if (type === 'insert') {
                    action = new InsertAction(entity, this.fdbCollection.dirName, this.fdbCollection.maps);
                } else if (type === 'update') {
                    action = new UpdateAction(entity, this.fdbCollection.dirName, this.fdbCollection.maps);
                } else if (type === 'remove') {
                    action = new RemoveAction(entity, this.fdbCollection.dirName, this.fdbCollection.maps);
                } else {
                    throw new Error('Unsupported action type');
                }

                this.actions.push(action);
                return this;
            }
        },
        each: {
            value: function (callback) {
                var a;

                for (a = 0; a < this.actions.length; a += 1) {
                    callback.call(this, this.actions[a], a);
                }

                return this;
            }
        }
    }
});
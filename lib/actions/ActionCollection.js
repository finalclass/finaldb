/*jslint node:true*/
'use strict';

var FinalClass = require('final-class'),
    InitCollectionAction = require('./InitCollectionAction.js'),
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
                this.clear();
            }
        },
        clear: {
            value: function () {
                this.actions = [];
            }
        },
        getAction: {
            value: function (type, entity) {
                var action;

                if (type === 'init') {
                    action = new InitCollectionAction(this.fdbCollection);
                } else if (type === 'insert') {
                    action = new InsertAction(entity, this.fdbCollection);
                } else if (type === 'update') {
                    action = new UpdateAction(entity, this.fdbCollection);
                } else if (type === 'remove') {
                    action = new RemoveAction(entity, this.fdbCollection);
                } else {
                    throw new Error('Unsupported action type');
                }

                action.type = type;

                return action;
            }
        },
        pushFront: {
            value: function (type, entity) {
                this.actions.unshift(this.getAction(type, entity));
                return this;
            }
        },
        push: {
            value: function (type, entity) {
                this.actions.push(this.getAction(type, entity));
                return this;
            }
        },
        hasAction: {
            value: function (actionType) {
                var i;

                for (i = 0; i < this.actions; i += 1) {
                    if (this.actions[i].type === actionType) {
                        return true;
                    }
                }

                return false;
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
/*jslint node:true*/
'use strict';

var sequence = require('when/sequence');
var finders = require('./finders.js');
var ffs = require('final-fs');
var when = require('when');
var mapper = require('./mapper.js');
var path = require('path');
var paths = require('./paths.js');
var utils = require('./utils.js');
var ActionCollection = require('./actions/ActionCollection.js');
var FinalClass = require('final-class');

module.exports = new FinalClass({
  className: 'finaldb_Collection',
  parents: [],
  descriptor: {
    flushDefer: {value: when(), writable: true},
    finaldb_Collection: {
      value: function (argv) {
        this.actions = new ActionCollection(this);

        if (typeof argv === 'string' || argv instanceof Array) {
          argv = {dirName: argv};
        }

        this.data = {
          dirName: argv.dirName,
          storeRevisions: argv.storeRevisions,
          maps: {}
        };

        if (this.data.dirName instanceof Array) {
          this.data.dirName = path.resolve.apply(this, this.data.dirName);
        }
      }
    },
    storeRevisions: {
      get: function () {
        return this.data.storeRevisions;
      },
      set: function (value) {
        this.data.storeRevisions = value;
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
          return finders.byMap(this.dirName, arguments[0], arguments[1]);
        default:
          throw new Error('Unsupported number of arguments');
        }
      }
    },
    map: {
      value: function (mapName, func) {
        this.maps[mapName] = func;
        return mapper.map(this.dirName, mapName, func);
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
        return utils.generateUniqueId();
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
        var defer = when.defer();

        this.flushDefer = this.flushDefer.then(function () {
          var jobs = [],
            dir = this.dirName;

          jobs.push(function () { //mkdir if dirs do not exist
            return ffs.mkdirRecursive(paths.rootMapsDir(dir), 0x1e0) //1e0 = 0740
              .then(function () {
                return ffs.mkdirRecursive(paths.documentsDir(dir), 0x1e0); //1e0 = 0740
              })
          });

          //convert all actions into array of functions
          this.actions.each(function (action) {
            jobs.push(function () {
              return action.execute();
            });
          });
          this.actions.clear();

          return sequence(jobs).then(defer.resolve, defer.reject);
        }.bind(this));

        return defer.promise;
      }
    }
  }
});
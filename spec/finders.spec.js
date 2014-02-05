/*jshint node:true*/
/*global describe, it, beforeEach, afterEach, expect, jasmine, waitsFor, runs*/
'use strict';

var finders = require('../lib/finders.js');
var fs = require('fs');
var ffs = require('final-fs');
var path = require('path');
var paths = require('../lib/paths.js');

describe('finders', function () {
  var dir = __dirname + '/var';

  beforeEach(function () {
    var i;
    var filePath;
    var dirPath;
    var files = [
      {id: 'one', rev: '1', foo: 'bar'},
      {id: 'two', rev: '1', foo: 'fbr'},
      {id: 'tree', rev: '1', abc: 'def'}
    ];

    for (i = 0; i < files.length; i += 1) {
      filePath = paths.documentPath(dir, files[i].id);
      dirPath = path.dirname(filePath);
      ffs.mkdirRecursiveSync(dirPath, 0x1ff);
      fs.writeFileSync(filePath, JSON.stringify(files[i]));
    }
  });

  afterEach(function () {
    ffs.rmdirRecursiveSync(dir);
  });

  it('find all', function () {
    var entities;

    finders.all(dir)
      .then(function (items) {
        entities = items;
      })
      .otherwise(function (err) {
        console.log(err.stack);
      });

    waitsFor(function () {
      return entities !== undefined;
    }, 'find all', 100);

    runs(function () {
      expect(entities.length).toBe(3);
    });
  });

  it('find by id', function () {
    var one;

    finders.byId(dir, 'one').then(function (entity) {
      one = entity;
    });

    waitsFor(function () {
      return one !== undefined;
    }, 100);

    runs(function () {
      expect(one.id).toBe('one');
      expect(one.rev).toBe('1');
      expect(one.foo).toBe('bar');
    });
  });

  it('should return an empty array when collection is not created', function (done) {
    finders.all(dir + '1') //set not existing directory
      .then(function (items) {
        expect(items && items.length === 0).toBeTruthy();
        done();
      });
  });

});
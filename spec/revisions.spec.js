/*jshint node:true*/
/*global describe, it, beforeEach, afterEach, expect, jasmine, waitsFor, runs*/

'use strict';

var fdb = require('../index.js');
var fs = require('fs');
var paths = require('../lib/paths.js');
var ffs = require('final-fs');

describe('actions', function () {
  var cars1;
  var cars2;
  var car;
  var carsDir1 = __dirname + '/var/cars1';
  var carsDir2 = __dirname + '/var/cars2';

  beforeEach(function () {
    cars1 = new fdb.Collection({dirName: carsDir1, storeRevisions: true});
    cars2 = new fdb.Collection({dirName: carsDir2, storeRevisions: false});
    car = {
      mark: 'Fiat',
      model: '126p'
    };
  });

  afterEach(function () {
    ffs.rmdirRecursiveSync(__dirname + '/var');
  });

  it('can store revisions', function () {
    var revisions = null;

    cars1
      .insert(car)
      .flush()
      .then(function () {
        return cars1.update(car).flush()
      })
      .then(function () {
        return ffs.readdirRecursive(carsDir1 + '/revisions', true);
      })
      .then(function (files) {
        revisions = files;
      })
      .otherwise(function (err) {
        console.log('err', [err, err.stack]);
      });

    waitsFor(function () {
      return revisions;
    }, 100, 'car to be stored');

    runs(function () {
      expect(revisions.length).toBe(1);
    });

  });

  it('can turn off revisions', function () {
    var revisionsDirExists = null;

    cars2
      .insert(car)
      .flush()
      .then(function () {
        return cars2.update(car).flush()
      })
      .then(function () {
        return ffs.exists(carsDir2 + '/revisions');
      })
      .then(function (exists) {
        revisionsDirExists = exists;
      })
      .otherwise(function (err) {
        console.log('err', [err, err.stack]);
      });

    waitsFor(function () {
      return revisionsDirExists !== null;
    }, 100, 'car to be stored');

    runs(function () {
      expect(revisionsDirExists === false).toBeTruthy();
    });
  });

});
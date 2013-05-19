/*jshint node:true*/
/*global describe, it, beforeEach, afterEach, expect, jasmine, waitsFor, runs*/

'use strict';

var fdb = require('../index.js'),
    fs = require('fs'),
    locker = require('../lib/locker.js'),
    ffs = require('final-fs');

describe('create update delete', function () {
    var cars, car1, car2;

    beforeEach(function () {
        cars = new fdb.Collection({dirName: __dirname + '/var/cars'});
        car1 = {
            mark: 'Fiat',
            model: '126p'
        };
        car2 = {
            mark: 'Volkswagen',
            model: 'Golf 1'
        };
    });

    afterEach(function () {
        ffs.rmdirRecursiveSync(__dirname + '/var');
    });

    it('removes lock on failure', function () {
        var isLocked;

        cars
            .remove({})// couses error: Arguments to path.resolve must be strings (no id specified)
            .flush()
            .ensure(function () {
                isLocked = locker.checkSync([__dirname, 'var/cars/lock']);
            });

        waitsFor(function () {
            return isLocked !== undefined;
        }, 100);

        runs(function () {
            expect(isLocked).toBe(false);
        });

    });

});
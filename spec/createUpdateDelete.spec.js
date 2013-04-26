/*jshint node:true*/
/*global describe, it, beforeEach, afterEach, expect, jasmine, waitsFor, runs*/

'use strict';

var fdb = require('../index.js'),
    EventEmitter = require('events').EventEmitter,
    fs = require('fs'),
    path = require('path'),
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

    it('creates dir if not exists', function () {
        var isDone = false;

        cars.createDirIfNotExists().then(function () {
            isDone = true;
        });

        waitsFor(function () {
            return isDone;
        }, 'creation of dir', 100);

        runs(function () {
            expect(fs.existsSync(__dirname + '/var/cars')).toBe(true);
        });
    });

    it('can insert', function () {
        var done = false;

        cars.insert(car1).flush().then(function () {
            done = true;
        });

        waitsFor(function () {
            return done;
        }, 'insert', 100);

        runs(function () {
            expect(fs.existsSync(__dirname + '/var/cars/' + car1.id + '.json')).toBe(true);
        });
    });

    it('can update', function () {
        var done = false,
            oldRev;

        cars.insert(car1);
        car1.mark = 'mercedes';
        oldRev = car1.rev;
        cars.update(car1);
        cars.flush().then(function () {
            done = true;
        });

        waitsFor(function () {
            return done;
        }, 'update', 100);

        runs(function () {
            var dir = __dirname + '/var/cars/' + car1.id;
            expect(fs.existsSync(dir + '.json')).toBe(true);
            expect(fs.existsSync(dir)).toBe(true);
            expect(fs.existsSync(dir + '/' + oldRev + '.json')).toBe(true);
            expect(JSON.parse(fs.readFileSync(dir + '.json')).mark).toBe('mercedes');
        });
    });

    it('can remove', function () {
        var done = false;

        cars.insert(car1).flush().then(function () {
            cars.remove(car1).flush().then(function () {
                done = true;
            });
        });

        waitsFor(function () {
            return done;
        }, 'remove car', 100);

        runs(function () {
            var dir = __dirname + '/var/cars/' + car1.id;
            expect(fs.existsSync(dir + '.json')).toBe(false);
            expect(fs.existsSync(dir)).toBe(false);
        });
    });

    it('can remove in sequence', function () {
        var done = false;

        cars.insert(car1)
            .remove(car1)
            .flush()
            .then(function () {
                done = true;
            });

        waitsFor(function () {
            return done;
        }, 'remove in sequence', 100);

        runs(function () {
            var dir = __dirname + '/var/cars/' + car1.id;
            expect(fs.existsSync(dir + '.json')).toBe(false);
            expect(fs.existsSync(dir)).toBe(false);
        });
    });

});
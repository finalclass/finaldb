/*jshint node:true*/
/*global describe, it, beforeEach, expect, jasmine, waitsFor, runs*/

'use strict';

var fdb = require('../index.js'),
    EventEmitter = require('events').EventEmitter,
    fs = require('fs');

var rmDirSync = function(dirPath) {
    var files;

    try {
        files = fs.readdirSync(dirPath);
    }
    catch(e) {
        return;
    }
    if (files.length > 0) {
        for (var i = 0; i < files.length; i++) {
            var filePath = dirPath + '/' + files[i];
            if (fs.statSync(filePath).isFile())
                fs.unlinkSync(filePath);
            else
                rmDirSync(filePath);
        }
    }
    fs.rmdirSync(dirPath);
};

describe('Collection', function () {

    var cars;

    beforeEach(function () {
        rmDirSync(__dirname + '/var');
        fs.mkdirSync(__dirname + '/var');
        cars = new fdb.Collection({dirName: __dirname + '/var/cars'});
    });

    it('is event emitter', function () {
        expect(new fdb.Collection() instanceof EventEmitter).toBe(true);
    });

    it('can create collection', function () {
        expect(function () {
            new fdb.Collection({dirName: __dirname + '/var'});
        }).not.toThrow();
    });

    it('creates directory on flush if necessary', function () {
        var collection = new fdb.Collection({dirName: __dirname + '/var/collection'}),
            isFulfilled = false;

        collection.flush().then(function () {
            isFulfilled = true;
        });

        waitsFor(function () {
            return isFulfilled;
        }, 'Directory never created', 100);

        runs(function () {
            expect(fs.existsSync(__dirname + '/var/collection')).toBe(true);
        });
    });

    it('can generate random id', function () {
        var collection = new fdb.Collection(),
            id = collection.generateUniqueId();

        expect(id.length > 0).toBe(true);
    });

    it('can save an entity', function () {
        var isDone = false,
            car = {
                mark: 'Fiat',
                model: '126p'
            };

        cars.persist(car).flush();

        cars.flush().then(function () {
            isDone = true;
        });

        waitsFor(function () {
            return isDone;
        }, 'Car save never finished', 100);

        runs(function () {
            expect(car.id.length > 0).toBeTruthy();
        });

    });

});
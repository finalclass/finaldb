/*jshint node:true*/
/*global describe, it, beforeEach, afterEach, expect, jasmine, waitsFor, runs*/
'use strict';

var Collection = require('../lib/Collection.js'),
    ffs = require('final-fs');

describe('finders', function () {
    var dir = __dirname + '/var/cars',
        cars;

    beforeEach(function () {
        var i,
            files = [
                {id: 'one', rev: '1', mark: 'fiat', model: '126p'},
                {id: 'two', rev: '1', mark: 'mercedes', model: 'benz'},
                {id: 'three', rev: '1', mark: 'mercedes', model: '124'},
                {id: 'four', rev: '1', mark: 'citroen', model: 'c5'},
                {id: 'five', rev: '1', mark: 'super Duper', model: 'MiliardQ'}
            ];

        ffs.rmdirRecursiveSync(dir);
        ffs.mkdirRecursiveSync(dir, 0x1ff);

        for (i = 0; i < files.length; i += 1) {
            ffs.writeFileSync(dir + '/' + files[i].id + '.json', JSON.stringify(files[i], null, '  '));
        }

        cars = new Collection({dirName: dir});
    });

    it('set map', function () {
        var array;

        cars
            .map('model_by_mark', function (emit, record) {
                emit(record.mark, record.model);
            })
            .then(function () {
                cars.find('model_by_mark', 'mercedes').then(function (result) {
                    array = result;
                });
            });

        waitsFor(function () {
            return array !== undefined;
        }, 'set map and find car by mark', 100);

        runs(function () {
            expect(array).toContain('benz');
            expect(array).toContain('124');
        });
    });

    it('same function is not rebuilding', function () {
        var func = function (emit, record) {
                emit(record.model, record);
            },
            done = false,
            tmpFilePath = __dirname + '/var/cars/__maps/car-by-model/test.tmp';

        cars
            .map('car by model', func) //create map (hash table)
            .then(function () { //write an empty 'control' file
                return ffs.writeFile(tmpFilePath, ''); //this file shouldn't be removed by the next map set
            })
            .then(function () { //try to create hash table again with same function
                return cars.map('car by model', func); //this map set should not rebuild the hash - func is the same!
            })
            .then(function () {
                done = true;
            });

        waitsFor(function () {
            return done;
        }, 'hash creation', 100);

        runs(function () { //check if tmpFilePath is removed. It shouldn't
            expect(ffs.existsSync(tmpFilePath)).toBeTruthy();
        });
    });

});
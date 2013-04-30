/*jshint node:true*/
/*global describe, it, beforeEach, afterEach, expect, jasmine, waitsFor, runs*/
'use strict';

var Collection = require('../lib/Collection.js'),
    ffs = require('final-fs');

describe('mapper', function () {
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

        ffs.mkdirRecursiveSync(dir, 0x1ff);

        for (i = 0; i < files.length; i += 1) {
            ffs.writeFileSync(dir + '/' + files[i].id + '.json', JSON.stringify(files[i], null, '  '));
        }

        cars = new Collection({dirName: dir});
    });

    afterEach(function () {
        ffs.rmdirRecursiveSync(dir);
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

    it('insert updates the map', function () {
        var func = function (emit, record) {
                emit(record.model, record);
            },
            barCars,
            testCars,
            car1 = {mark: 'foo', model: 'bar'},
            car2 = {mark: 'test', model: '126p'};

        cars
            .map('car by model', func)
            .then(function () {
                return cars
                    .insert(car1)
                    .insert(car2)
                    .flush();
            })
            .then(function () {
                return cars.find('car by model', 'bar');
            })
            .then(function (result) {
                barCars = result;
                return cars.find('car by model', '126p');
            })
            .then(function (result) {
                testCars = result;
            })
            .otherwise(function (err) {
                console.log(err);
                console.log(err.stack);
            });

        waitsFor(function () {
            return barCars !== undefined && testCars !== undefined;
        }, 'car insert and map update', 100);

        runs(function () {
            expect(barCars[0].mark).toBe(car1.mark);
            expect(testCars.length).toBe(2);
            expect(testCars[0].model).toBe(car2.model);
            expect(testCars[0].mark === 'test' || testCars[0].mark === 'fiat').toBeTruthy();
        });
    });

    it('remove action removes also mapped values', function () {
        var fiatModels;

        cars
            .map('models by mark', function (emit, obj) {
                emit(obj.mark, obj.model);
            })
            .then(function () {
                return cars.find('one');
            })
            .then(function (carOne) {
                return cars.remove(carOne).flush();
            })
            .then(function () {
                expect(ffs.existsSync(__dirname + '/var/cars/one.json')).not.toBeTruthy();
                return cars.find('models by mark', 'fiat');
            })
            .then(function (result) {
                fiatModels = result;
            })
            .otherwise(function (err) {
                console.log(err);
                console.log(err.stack);
            });

        waitsFor(function () {
            return fiatModels !== undefined;
        }, 'remove and clean map', 100);

        runs(function () {
            expect(fiatModels.length).toBe(0);
        });
    });

    it('update change the map values', function () {
        var fooModels,
            fiatModels;

        cars
            .map('models by mark', function (emit, obj) {
                emit(obj.mark, obj.model);
            })
            .then(function () {
                return cars.find('one');
            })
            .then(function (carOne) {
                carOne.mark = 'foo';
                return cars.update(carOne).flush();
            })
            .then(function () {
                return cars.find('models by mark', 'foo');
            })
            .then(function (result) {
                fooModels = result;
                return cars.find('models by mark', 'fiat');
            })
            .then(function (result) {
                fiatModels = result;
            })
            .otherwise(function (err) {
                console.log(err);
                console.log(err.stack);
            });

        waitsFor(function () {
            return fooModels !== undefined && fiatModels !== undefined;
        }, 'update cars and change maps', 100);

        runs(function () {
            expect(fooModels.length).toBe(1);
            expect(fiatModels.length).toBe(0);
        });
    });

});
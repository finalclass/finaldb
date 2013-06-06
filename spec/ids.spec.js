/*jshint node:true*/
/*global describe, it, beforeEach, afterEach, expect, jasmine, waitsFor, runs*/

'use strict';

var fdb = require('../index.js'),
    fs = require('fs'),
    ffs = require('final-fs');

describe('ids', function () {
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

    it ('saves file in 2 sub directories', function () {
        var done = false;

        cars.insert(car1).flush()
            .then(function () {
                done = true;
            })
            .otherwise(function (err) {
                console.log(err.stack);
            });

        waitsFor(function () {
            return done;
        }, 100);

        runs(function () {
            var dir = __dirname + '/var/cars/data';

            ffs.readdirSync(dir).forEach(function (subDir) {
                ffs.readdirSync(dir + '/' + subDir).forEach(function (subSubDir) {
                    ffs.readdirSync(dir + '/' + subDir + '/' + subSubDir).forEach(function (file) {
                        expect(file).toBe(car1.id + '.json');
                    });
                });
            });
        });
    });

});
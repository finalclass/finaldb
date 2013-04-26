/*jshint node:true*/
/*global describe, it, beforeEach, afterEach, expect, jasmine, waitsFor, runs*/
'use strict';

var finders = require('../lib/finders.js'),
    fs = require('fs'),
    ffs = require('final-fs');

describe('finders', function () {
    var dir = __dirname + '/var';

    beforeEach(function () {
        var files = [
                {
                    id: 'one',
                    rev: '1',
                    foo: 'bar'
                },
                {
                    id: 'two',
                    rev: '1',
                    foo: 'fbr'
                },
                {
                    id: 'tree',
                    rev: '1',
                    abc: 'def'
                }
            ],
            i;

        ffs.mkdirSync(dir, 0x1ff);

        for (i = 0; i < files.length; i += 1) {
            fs.writeFileSync(dir + '/' + files[i].id + '.json', JSON.stringify(files[i]));
        }
    });

    afterEach(function () {
        ffs.rmdirRecursiveSync(dir);
    });

    it('find all', function () {
        var entities;

        finders.all(dir).then(function (items) {
            entities = items;
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
        });

        runs(function () {
            expect(one.id).toBe('one');
            expect(one.rev).toBe('1');
            expect(one.foo).toBe('bar');
        });

    });

});
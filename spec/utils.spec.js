/*jshint node:true*/
/*global describe, it, beforeEach, afterEach, expect, jasmine, waitsFor, runs*/
'use strict';

var utils = require('../lib/utils.js');

describe('mapper', function () {

    it('sanitize', function () {
        var obj = {
            foo: 'bar',
            test: 'test2',
            abc: 'def'
        };

        utils.sanitize(obj, ['foo', 'abc']);

        expect(obj.text).not.toBeDefined();
    });

    it('hashCode has at least 4 characters', function () {
        expect(utils.hashCode().length).toBeGreaterThan(3);
    });

});
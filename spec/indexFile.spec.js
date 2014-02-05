/*global describe, it, beforeEach, expect*/

describe('indexFile', function () {
  'use strict';

  var fdb = require('../index.js');

  it('exports things', function () {
    expect(fdb.Collection).toBeDefined();
  });

});
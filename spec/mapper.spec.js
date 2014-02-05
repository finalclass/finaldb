/*jshint node:true*/
/*global describe, it, beforeEach, afterEach, expect, jasmine, waitsFor, runs*/
'use strict';

var Collection = require('../lib/Collection.js');
var paths = require('../lib/paths.js');
var ffs = require('final-fs');

describe('mapper', function () {
  var rootDir = __dirname + '/var/cars';
  var cars;
  var files;

  beforeEach(function () {
    var i;

    files = [
      {id: 'one', rev: '1', mark: 'fiat', model: '126p'},
      {id: 'two', rev: '1', mark: 'mercedes', model: 'benz'},
      {id: 'three', rev: '1', mark: 'mercedes', model: '124'},
      {id: 'four', rev: '1', mark: 'citroen', model: 'c5'},
      {id: 'five', rev: '1', mark: 'super Duper', model: 'MiliardQ'}
    ];

    ffs.mkdirRecursiveSync(rootDir, 0x1ff);

    for (i = 0; i < files.length; i += 1) {
      ffs.mkdirRecursiveSync(paths.documentDir(rootDir, files[i].id), 0x1e0 /*0740*/);
      ffs.writeFileSync(paths.documentPath(rootDir, files[i].id), JSON.stringify(files[i], null, '  '));
    }

    cars = new Collection({dirName: rootDir});
  });

  afterEach(function () {
    ffs.rmdirRecursiveSync(__dirname + '/var');
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
      })
      .otherwise(function (err) {
        console.log(err);
        console.log(err.stack);
      });

    waitsFor(function () {
      return array !== undefined;
    }, 'set map and find car by mark', 100);

    runs(function () {
      expect(array).toContain('benz');
      expect(array).toContain('124');
    });
  });

  it('find map by not existing key returns empty array', function () {
    var array;

    cars
      .map('model_by_mark', function (emit, record) {
        emit(record.mark, record.model);
      })
      .then(function () {
        return cars.find('model_by_mark', 'not existing').then(function (result) {
          array = result;
        });
      })
      .otherwise(function (err) {
        console.log(err);
        console.log(err.stack);
      });

    waitsFor(function () {
      return array !== undefined;
    }, 'set map and find car by mark', 100);

    runs(function () {
      expect(array.length).toBe(0);
    });
  });

  it('same function is not rebuilding', function () {
    var func = function (emit, record) {
        emit(record.model, record);
      },
      done = false,
      tmpFilePath = paths.mapDir(rootDir, 'car by model') + '/test.tmp';

    cars
      .map('car by model', func) //create map (hash table)
      .then(function () { //write an empty 'control' file
        return ffs.writeFile(tmpFilePath, 'test'); //this file shouldn't be removed by the next map set
      })
      .then(function () { //try to create hash table again with same function
        return cars.map('car by model', func); //this action should not rebuild the hash - func is the same!
      })
      .then(function () {
        done = true;
      })
      .otherwise(function (err) {
        console.log(err);
        console.log(err.stack);
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
        expect(ffs.existsSync(paths.documentPath(rootDir, 'one'))).not.toBeTruthy();
        return cars.find('models by mark', 'fiat');
      })
      .then(function (result) {
        fiatModels = result;
      })
      .otherwise(function (err) {
        if (err.message === 'not_found') {
          fiatModels = [];
          return;
        }
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
      .otherwise(function (err) {
        if (err.message === 'not_found') {
          fooModels = [];
        }
      })
      .then(function (result) {
        fooModels = result;
        return cars.find('models by mark', 'fiat');
      })
      .then(function (result) {
        fiatModels = result;
      })
      .otherwise(function (err) {
        if (err.message === 'not_found') {
          fiatModels = [];
          return;
        }
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

  it('on update only one instance of record remains in map', function () {
    var done = false,
      car1 = files[0],
      foundCars;

    cars
      .map('cars by mark', function (emit, obj) {
        emit(obj.mark, obj);
      })
      .then(function () {
        car1.model = 'foo';
        return cars.update(car1).update(car1).flush();
      })
      .then(function () {
        return cars.find('cars by mark', 'fiat');
      })
      .then(function (result) {
        foundCars = result;
        done = true;
      });

    waitsFor(function () {
      return foundCars !== undefined;
    }, 'update', 100);


    runs(function () {
      expect(foundCars.length).toBe(1);
    });
  });

  it('can map by array', function () {
    var foundRecords = null;

    cars
      .map('car by mark and model', function (emit, record) {
        emit([record.mark, record.model], record);
      })
      .then(function () {
        return cars.find('car by mark and model', ['fiat', '126p']);
      })
      .then(function (result) {
        foundRecords = result;
      })
      .otherwise(function (err) {
        console.log([err, err.stack]);
      });

    waitsFor(function () {
      return foundRecords !== null;
    }, 'create map with array key and find by it', 100);

    runs(function () {
      expect(foundRecords.length).toBe(1);
      expect(foundRecords[0].id).toBe('one');
    });
  });

});
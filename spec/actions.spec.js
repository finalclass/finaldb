/*jshint node:true*/
/*global describe, it, beforeEach, afterEach, expect, jasmine, waitsFor, runs*/

'use strict';

var fdb = require('../index.js');
var fs = require('fs');
var paths = require('../lib/paths.js');
var ffs = require('final-fs');

describe('actions', function () {
  var cars, car1, car2, rootDir = __dirname + '/var/cars';

  beforeEach(function () {

    cars = new fdb.Collection({dirName: rootDir});
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

  it('can insert', function () {
    var done = false;

    cars.insert(car1).flush()
      .then(function () {
        done = true;
      }).otherwise(function (err) {
        console.log(err.stack);
      });

    waitsFor(function () {
      return done;
    }, 'insert', 100);

    runs(function () {
      expect(
        fs.existsSync(paths.documentPath(rootDir, car1.id))
      ).toBe(true);
    });
  });

  it('can update', function () {
    var done = false,
      oldRev;

    cars.insert(car1);
    car1.mark = 'mercedes';
    oldRev = car1.rev;

    cars
      .update(car1)
      .flush()
      .then(function () {
        done = true;
      })
      .otherwise(function (err) {
        console.log(err);
      });

    waitsFor(function () {
      return done;
    }, 'update', 100);

    runs(function () {
      var docPath = paths.documentPath(rootDir, car1.id),
        revPath = paths.revisionPath(rootDir, car1.id, oldRev);

      expect(fs.existsSync(docPath)).toBe(true);
//      expect(fs.existsSync(revPath)).toBe(true);
      expect(JSON.parse(fs.readFileSync(docPath)).mark).toBe('mercedes');
    });
  });

  it('update keep createdAt when not specified', function () {
    var done, car1v2;

    // Inserts the original record.
    cars.insert(car1);

    done = false;
    cars.flush().then(function () {
      done = true;
    });

    waitsFor(function () {
      return done;
    });
    runs(function () {
      // Inserts an updated record without `createdAt`.
      cars.update({
        id: car1.id, // Keeps the same id, it is the same record.
        mark: 'Mercedes',
        model: 'Zetros',
      });

      done = false;
      cars.flush().then(function () {
        done = true;
      });
    });

    waitsFor(function () {
      return done;
    });
    runs(function () {
      // Retrieves the record.
      cars.find(car1.id).then(function (result) {
        car1v2 = result;
      });
    });

    waitsFor(function () {
      return car1v2;
    });
    runs(function () {
      // Asserts `createdAt` has been kept.
      expect(car1v2.createdAt).toBe(car1.createdAt);
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
      expect(fs.existsSync(paths.documentPath(rootDir, car1.id))).toBe(false);
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
      expect(fs.existsSync(paths.documentPath(rootDir, car1.id))).toBe(false);
    });
  });

  it('save inserts when no record found', function () {
    var done = false;

    cars
      .save(car1)
      .flush()
      .then(function () {
        done = true;
      });

    waitsFor(function () {
      return done;
    }, 'save insert', 100);

    runs(function () {
      expect(fs.existsSync(paths.documentPath(rootDir, car1.id))).toBe(true);
    });
  });

  it('save updates when record found', function () {
    var done = false;

    cars.insert(car1)
      .flush()
      .then(function () {
        car1.model = 'foo';
        return cars
          .save(car1)
          .flush();
      })
      .then(function () {
        done = true;
      });

    waitsFor(function () {
      return done;
    }, 'save insert', 100);

    runs(function () {
      expect(fs.existsSync(paths.documentPath(rootDir, car1.id))).toBe(true);
    });
  });

});
# Final-DB Embedded NoSQL database for nodejs platform.

Final DB is NoSQl database that uses your file system as a storage.
It uses [when](https://github.com/cujojs/when) library for async calls.

## Insert

    var fdb = require('fdb'),
        john = {name: 'John'},
        users = new fdb.Collection({dirName: __dirname + '/var'});

    users.insert(john);
    users.flush().then(function () {
        //do something on finish
    });

## Update

    var fdb = require('fdb'),
        john = {id: 'sjwke234', name: 'JOHN'},
        users = new fdb.Collection({dirName: __dirname + '/var'});

    users.update(john);
    users.flush().then(function () {
        //do something on finish
    });

## Remove

    var fdb = require('fdb'),
        john = {id: 'sjwke234'},
        users = new fdb.Collection({dirName: __dirname + '/var'});

    users.remove(john);
    users.flush().then(function () {
        //do something on finish
    });

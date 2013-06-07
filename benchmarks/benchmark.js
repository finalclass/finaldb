/*jshint node:true*/
'use strict';

var fdb = require('../'),
    collectionDir = __dirname + '/users',
    users,
    when = require('when'),
    sequence = require('when/sequence'),
    ffs = require('final-fs'),
    withMaps = true,
    numRecords = 100000,
    i,
    time;

//prepare the collection

users = new fdb.Collection(collectionDir);

if (withMaps) {
    users.map('users by section', function (emit, user) {
        emit(user.section, user);
    });

    users.map('users by role', function (emit, user) {
        var i;

        for (i = 0; i < user.roles.length; i += 1) {
            emit(user.roles[i], user);
        }
    });
}


//prepare data

for (i = 0; i < numRecords; i += 1) {
    users.insert({
        id: i.toString(36),
        section: (i % (numRecords / 100)).toString(36),
        name: 'Lorem ipsum',
        email: 'password@password.com',
        password: 'skjds23kj43kjf02j48',
        roles: ['user', 'guest', 'moderator']
    });
}

function info(msg, time) {
    var i,
        maxChars = 30;

    if (msg.len > maxChars) {
        msg = msg.substr(0, maxChars);
    }

    for (i = msg.length; i < maxChars; i += 1) {
        msg += ' ';
    }

    console.log('# ' + msg, time[0] + ',' + time[1] + 's');
}

console.log('Running test on ' + numRecords + ' records ' + (withMaps ? ' with 2 maps' : 'with no maps'));

//test write time
console.log('-- try to insert');
time = process.hrtime();
users
    .flush() //test save
    .then(function () {
        time = process.hrtime(time);
        info('insertion of ' + numRecords + ' files', time);
    })
    .then(function () { //test find
        var functions = [],
            i;
        console.log('-- try to find individually');
        for (i = 0; i < numRecords; i += 1) {
            functions.push((function (i) {
                return function () {
                    return users.find(i.toString(36));
                };
            }(i)));
        }

        time = process.hrtime();
        return sequence(functions);
    })
    .then(function () {
        time = process.hrtime(time);
        info('finding ' + numRecords + ' individual files', time);
    })
    .then(function () { //test by section map
        if (!withMaps) {
            return;
        }
        var defer = when.defer(),
            promise = defer.promise,
            i;

        console.log('-- try to find by section');

        for (i = 0; i < numRecords / 100; i += 1) {
            promise = promise.then(users.find('users by section', i.toString(36)));
        }

        defer.resolve();
        time = process.hrtime();
        return defer.promise;
    })
    .then(function () {
        if (!withMaps) {
            return;
        }
        time = process.hrtime(time);
        info('finding by section ' + (numRecords / 100) + ' files', time);
    })

    .then(function () { // find by role
        if (!withMaps) {
            return;
        }
        var promises = [];

        console.log('-- try to find by role');

        promises.push(users.find('users by role', 'user'));
        promises.push(users.find('users by role', 'guest'));
        promises.push(users.find('users by role', 'moderator'));

        time = process.hrtime();
        return when.all(promises);
    })
    .then(function () {
        if (!withMaps) {
            return;
        }
        time = process.hrtime(time);
        info('finding by role files', time);
    })
    .then(function () { //find all
        console.log('-- try to find all');
        time = process.hrtime();
        return users.find();
    })
    .then(function () {
        time = process.hrtime(time);
        info('find all ' + numRecords + ' files', time);
    })
    .then(function () { // update
        var i;

        console.log('-- try to update');

        for (i = 0; i < numRecords; i += 1) {
            users.update({
                id: i.toString(36),
                section: ((i + 1) % (numRecords / 100)).toString(36),
                roles: ['guest', 'moderator', 'admin']
            });
        }

        time = process.hrtime();
        return users.flush();
    })
    .then(function () {
        time = process.hrtime(time);
        info('update ' + numRecords + ' files', time);
    })
    .then(function () {
        console.log('-- try to find before delete');
        return users.find();
    })
    .then(function (all) { //delete
        var i;

        console.log('-- try to delete');

        for (i = 0; i < all.length; i += 1) {
            users.remove(all[i]);
        }

        time = process.hrtime();
        return users.flush();
    })
    .then(function () {
        time = process.hrtime(time);
        info('remove ' + numRecords + ' files', time);
    })
    .then(function () {
        ffs.rmdirRecursiveSync(collectionDir);
    })
    .otherwise(function (err) {
        console.log(err.stack);
        ffs.rmdirRecursiveSync(collectionDir);
    });





# Final-DB Embedded NoSQL database for nodejs platform.

**MIT License** (see LICENSE.txt)

- Final DB is a NoSQl database that uses file system as a storage.
- It uses [when](https://github.com/cujojs/when) library for async calls.
- It's totally asynchronous. No synchronous function is called in it's code.
- Every async function returns a Promise. See [when](https://github.com/cujojs/when) documentation.
- Uses [final-fs](https://github.com/finalclass/final-fs) library for file system manipulation.

## Version 2

Version 2 does not support version 1 databases. Whole files organisation is rewriten to allow users to store
milions of documents.

Also there is benchmark available in benchmarks directory. Benchmark is set to run for 100 000 files.
Change it if you want.

API is not changed in version 2.

## fdb.Collection constructor

The fdb.Collection constructor takes one argument: an object of options.
At this moment you can pass 2 arguments through the options object: dirName(string) and storeRevisions(boolean).
This option can be set as a string or an Array.
If you've specified dirName as an Array then path.resolve is called on this array.

If instead of specifying an object as an input to fdb.Collection you've specified a string or an array
then this argument is taken as a dirName.

These are valid instantiations of fdb.Collection:

```js
var fdb = require('final-db');

new fdb.Collection({dirName: '/path/to/collection/files'});
//or
new fdb.Collection({dirName: ['path', 'to', 'collection', 'files']});
//or
new fdb.Collection('/path/to/collection/files');
//or
new fdb.Collection(['path', 'to', 'collection', 'files']);
```

If you specify `storeRevisions` options flag then whenever you update the record, old record will be moved to the revisions directory.

## Insert

```js
var fdb = require('final-db'),
    john = {name: 'John'},
    users = new fdb.Collection({dirName: __dirname + '/var'});

users.insert(john);
//Now john.id, john.rev, john.updatedAt (equal to createdAt) and john.createdAt properties are available (these are generated randomly)
users.flush().then(function () {
    //do something on finish
});
```

When you invoke `.insert(entity)` the id, rev, updatedAt (equal to createdAt) and createdAt properties of the element are set.

When you run .flush() few thinks happen:

- Check if directory dirName exists
- If it's not this directory will be created
- Next execute all the actions (.insert(), .update() or .remove()) in a sequnece (one after the other) (async of course:))
- finally return a promise.

## Update

```js
var fdb = require('final-db'),
    john = {id: 'sjwke234', name: 'JOHN'},
    users = new fdb.Collection({dirName: __dirname + '/var'});

users.update(john);
//john.rev and john.updatedAt are changed now
users.flush().then(function () {
    //do something on finish
});
```

When you invoke `.update(entity)` the rev and updatedAt properties are changed.

**If `collection.storeRevisions` property** was set then:
After doing flush, old version of updated record will be saved in a file located here:
collectionDir/recordId/revisionNumber.json
So you can revert any change any time.

## Save

Save method checks (by id) if record exists and if it's not executes insert but if record exists then executes update.

```js
var fdb = require('final-db'),
    john = {id: 'sjwke234', name: 'JOHN'},
    users = new fdb.Collection({dirName: __dirname + '/var'});

users
    .save(john);
    .flush().then(function () {
        //do something on finish
    });
```

## Remove

```js
var fdb = require('final-db'),
    john = {id: 'sjwke234'},
    users = new fdb.Collection({dirName: __dirname + '/var'});

users.remove(john);
users.flush().then(function () {
    //do something on finish
});
```

## Flush

When you call `.flush()` the collection is locked and it's impossible for any other process to change it.
When all jobs are finished (or if error occured) the collection is unlocked.

## Find by id

```js
var fdb = require('final-db'),
    users = new fdb.Collection({dirName: __dirname + '/var'});

users.find('userId').then(function (user) {
    // we got user object now
});
```

## Find all

```js
var fdb = require('final-db'),
    users = new fdb.Collection({dirName: __dirname + '/var'});

users.find().then(function (allUsers) {
    // we got all users as array of objects now
});
```

## More complex searches

For more complex search methods final-db uses maps. So set a map, and search by this map. This method is super fast
and does not need to walk through all the records. It's just reading one file - it's how fast it is.

The only downside of this is that any insert / update / remove has to update the hash table stored on disk for the specific
key value. It's also very fast since it alteres only one file per map.

## Map

You can set map function. This function is executed when new records are inserted / updated.
If you set a map and there is no map with the same name or the map with the same name
has different code then the map is rebuild. So be carefull when working with huge databases - it's
important to know this fact.

Map keys are converted to file name valid string with final-fs fileNameFilter function. Remember this when
creating keys.

Your map key can also be an array. In this situation key is converted using `join` function: `key = key.join('-')`.

**Remember that you must emit in emit function!**

###### Example: Create map and find by key in the map.

```js
var fdb = require('final-db'),
    path = require('path'),
    cars = new fdb.Collection({dirName: path.resolve(__dirname, 'var', 'cars')});

cars
    .insert({mark: 'mercedes', model: 'A-class'})
    .insert({makr: 'mercedes', model: 'B-class'})
    .flush()
    .then(function () {
        return cars.map('model_by_mark', function (emit, record) {
            emit(record.mark, record.model);
        })
    })
    .then(function () {
        return cars
            .insert({mark: 'mercedes', model: 'C-class'})
            .flush();
    })
    .then(function () {
        return cars.find('model_by_mark', 'mercedes')
    })
    .then(function (modelsArray) {
        //modelsArray === ['A-class', 'B-class', 'C-class']
    })
    .otherwise(function (err) {
        //if some error occured in the async call chain then this function will run. See err for details
    });
```

Remember that when you set a map and the map was previously set (even in different program execution) then the map is not rebuild.
In other words, every time you call function map on a collection it stores the map function in a file. Next time when it's
called it checks if provided map function is different with the one stored in a file. If and only if it's different then
the map is rebuild (map function is beeing called on every record in a collection).

### Emit function

When setting a map function you have 2 arguments: emit function and object. Emit function takes 2 arguments:
key and value.

- key is a hash key.
- value is a value you want to save in the hash.


### lock() and unlock()

FinalDB `Collection` class has method lock and unlock. You can use them to lock the table for a certain period of time or until you
unlock it.


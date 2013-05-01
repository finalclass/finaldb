/*jshint node:true*/
'use strict';

exports.sanitize = function (entity, wantedValuesArray) {
    var prop;

    for (prop in entity) {
        if (wantedValuesArray.indexOf(prop) === -1) {
            delete entity[prop];
        }
    }

    return entity;
};
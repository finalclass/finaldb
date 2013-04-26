/*jslint node:true*/
'use strict';

var crypto = require('crypto');

module.exports = function () {
    return crypto.createHash('md5')
        .update((new Date().getTime() * Math.random()).toString())
        .digest('hex');
}
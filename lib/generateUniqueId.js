/*jslint node:true*/
'use strict';

module.exports = function () {
    return (+new Date() + Math.round(Math.random() * 1e17)).toString(36);
};
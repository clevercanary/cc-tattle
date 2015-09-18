/**
 * Error Log DAO
 */
"use strict";
var mongoose = require("mongoose");
var queryBuilder = require("./../utils/querybuilder");
var ErrorLog = mongoose.model("ErrorLog");

/**
 * Create Error Log
 *
 * @param errorLog {Object}
 * @param next{Function}
 */
exports.createErrorLog = function(errorLog, next) {

    ErrorLog.create(errorLog, next);
};

/**
 * Find All Error Logs
 *
 * @param qm {QueryModel}
 * @param next {Function}
 */
exports.findAllErrorLogs = function(qm, next) {

    var query = ErrorLog.find();
    queryBuilder.buildQuery(query, qm);
    query.exec(next);
};

/**
 * Find One Error Log
 *
 * @param qm {QueryModel}
 * @param next {Function}
 */
exports.findErrorLog = function(qm, next) {

    var query = ErrorLog.findOne();
    queryBuilder.buildQuery(query, qm);
    query.exec(next);
};

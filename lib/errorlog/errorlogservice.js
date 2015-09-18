/**
 * Error Log Service
 */
"use strict";
var errorLogDAO = require("./errorlogdao");
var QueryModel = require("../utils/querymodel");

/**
 * Create Error Log
 *
 * @param errorLog {Object}
 * @param next {Function}
 */
function createErrorLog(errorLog, next) {

    errorLogDAO.createErrorLog(errorLog, next);
}
exports.createErrorLog = createErrorLog;

/**
 * Find All Error Logs
 *
 * @param qm {QueryModel}
 * @param next {Function}
 */
function findAllErrorLogs(qm, next) {

    errorLogDAO.findAllErrorLogs(qm, next);
}
exports.findAllErrorLogs = findAllErrorLogs;

/**
 * Find Error Log QM
 *
 * @param qm {QueryModel}
 * @param next {Function}
 */
function findErrorLog(qm, next) {

    errorLogDAO.findErrorLog(qm, next);
}
exports.findErrorLog = findErrorLog;

/**
 * Find Error Log By Id
 *
 * @param errorLogId {string | ObjectId}
 * @param next {Function}
 */
function findErrorLogById(errorLogId, next) {

    var qm = new QueryModel();
    qm.addEqualsQueryFilter("_id", errorLogId);
    findErrorLog(qm, next);
}
exports.findErrorLogById = findErrorLogById;
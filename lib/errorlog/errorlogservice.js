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

    errorLogDAO.findAllErrorLogs(qm, function(error, errorLogs) {

        if (error) {
            return next(error);
        }

        if (!qm.isPaginated()) {

            return next(null, {
                items: errorLogs
            });
        }

        var countQM = new QueryModel();
        countQM.initFrom(qm);
        countQM.setAsCountFunction();

        errorLogDAO.findAllErrorLogs(countQM, function(error, errorLogCount) {

            if (error) {
                return next(error);
            }

            next(null, {
                items: errorLogs,
                count: errorLogCount
            });
        });
    });
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

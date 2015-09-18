/**
 * Error Log Web Controller
 */
"use strict";

var ccExpressUtils = require("cc-express-utils");
var errorLogService = require("./errorlogservice");
var QueryModel = require("../utils/querymodel");

/**
 * Create Error Log
 *
 * @param req
 * @param res
 */
exports.createErrorLog = function(req, res) {

    var errorLog = req.body;
    errorLogService.createErrorLog(errorLog, ccExpressUtils.setupResponseCallback(res));
};

/**
 * Find All Error Logs
 *
 * @param req
 * @param res
 */
exports.findAllErrorLogs = function(req, res) {

    var qm = new QueryModel(req);
    errorLogService.findAllErrorLogs(qm, ccExpressUtils.setupResponseCallback(res));
};

/**
 * Find Error Log
 *
 * @param req
 * @param res
 */
exports.findErrorLog = function(req, res) {

    var qm = new QueryModel(req);
    errorLogService.findErrorLog(qm, ccExpressUtils.setupResponseCallback(res));
};

/**
 * Find Error Log By Id
 *
 * @param req
 * @param res
 */
exports.findErrorLogById = function(req, res) {

    var errorLogId = req.params.id;
    errorLogService.findErrorLogById(errorLogId, ccExpressUtils.setupResponseCallback(res));
};


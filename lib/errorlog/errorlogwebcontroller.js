/**
 * Error Log Web Controller
 */
"use strict";

var ccExpressUtils = require("cc-express-utils");
var errorLogService = require("./errorlogservice");
var QueryModel = require("cc-qm").QueryModel;

/**
 * Create Error Log
 *
 * @param req
 * @param res
 */
exports.createErrorLog = function(req, res) {

    var errorLog = {
        stack: req.body.message + "\n" + req.body.stackTrace,
        url: req.body.url,
        user: req.user._id || "",
        userAgent: req.headers["user-agent"],
        client: true
    };
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


/**
 * Tattle
 */
"use strict";

require("./errorlog/errorlog");
var errorLogWebController = require("./errorlog/errorlogwebcontroller");
var errorLogService = require("./errorlog/errorlogservice");
var ccExpressUtils = require("cc-express-utils");
var _ = require("lodash");
var nodemailer = require("nodemailer");
var mandrill = require("mandrill-api");
var sendgrid = require("sendgrid");


/**
 *
 * @constructor Tattle
 */
function Tattle() {}

/**
 *
 * @param config
 */
Tattle.prototype.initialize = function(config) {

    this._config = config;
    this._setClient();
    this._setClientOptions();
    this._handleUncaughtException();
};

/**
 * Config setter
 *
 * @param key {string}
 * @param val {*}
 */
Tattle.prototype.set = function(key, val) {

    this._config[key] = val;
};

/**
 * Express error handler
 *
 * @returns {Function}
 */
Tattle.prototype.expressErrorHandler = function() {

    var self = this;

    return function(error, req, res, next) {
        console.error(error);

        console.log("express handler");

        var userId;
        if (req.user) {
            userId = req.user._id;
        }

        var errLog = {
            user: userId,
            userAgent: req.headers["user-agent"],
            method: req.method,
            url: req.originalUrl,
            query: JSON.stringify(req.query),
            body: JSON.stringify(req.body),
            stack: error.stack,
            createdAt: new Date()
        };

        errorLogService.createErrorLog(errLog, function(dbError, savedErrorLog) {

            if (dbError) {
                return next(dbError);
            }
            var errorLogId = savedErrorLog._id.toString();
            self._emailError(error, errorLogId, ccExpressUtils.setupResponseCallback(res));
        });
    };
};

/**
 * Create
 *
 * @param req
 * @param res
 */
Tattle.prototype.createErrorLog = function(req, res) {

    errorLogWebController.createErrorLog(req, res);
};

/**
 * Find All
 *
 * @param req
 * @param res
 */
Tattle.prototype.findAllErrorLogs = function(req, res) {

    errorLogWebController.findAllErrorLogs(req, res);
};

/**
 * Find One
 *
 * @param req
 * @param res
 */
Tattle.prototype.findErrorLog = function(req, res) {

    errorLogWebController.findErrorLog(req, res);
};

/**
 * Find One By Id
 *
 * @param req
 * @param res
 */
Tattle.prototype.findErrorLogById = function(req, res) {

    errorLogWebController.findErrorLogById(req, res);
};

/**
 * Handle Uncaught Exception
 *
 * @private
 */
Tattle.prototype._handleUncaughtException = function() {

    var self = this;
    process.on("uncaughtException", function(error) {

        console.error(error);
        var errorLog = {
            stack: error.stack,
            createdAt: new Date()
        };
        errorLogService.createErrorLog(errorLog, function(dbError, savedErrorLog) {

            var errorLogId = savedErrorLog._id.toString();
            self._emailError(error, errorLogId, process.exit);
        });
    });
};

/**
 * Email Error Log Id TODO give options for what to email
 *
 * @param error {Error}
 * @param errorLogId {string}
 * @param next {Function}
 * @private
 */
Tattle.prototype._emailError = function(error, errorLogId, next) {

    var config = this._config;
    var client = this._client;
    var transport = this._buildTransport();
    var emailOptions = this._buildEmailOptions();

    // TODO email body options
    emailOptions.html = "Error id: " + errorLogId;

    if (client === "nodemailer" && config.debug) {

        return transport.sendMail(emailOptions, function(transportError) {

            transport.close();
            if (transportError) {
                console.log("transport error:\n");
                console.log(transportError);
                return next(transportError);
            }
            next(error);
        });
    }
    else if (client === "sendgrid") {

        return transport.send(emailOptions, next);
    }
    else if (client === "mandrill") {

        return transport.messages.send({message: emailOptions},
            function() {
                next(true);
            },
            function(err) {
                console.log(err);
                next(false);
            });
    }
};

/**
 * Build client email options
 *
 * @returns {Object}
 * @private
 */
Tattle.prototype._buildEmailOptions = function() {

    var config = this._config;
    var client = this._client;
    var emailConfig = config.email;

    var emailOptions = {
        to: emailConfig.admins,
        subject: "Application Error"
    };

    if (client === "nodemailer" && config.debug) {
        _.extend(emailOptions, {
            from: "\"" + emailConfig.noReplyName + "\" <" + emailConfig.noReply + ">"
        });
    }
    else if (client === "sendgrid") {
        _.extend(emailOptions, {
            from: emailConfig.noReply,
            fromname: emailConfig.noReplyName
        });
    }
    else if (client === "mandrill") {
        _.extend(emailOptions, {
            from_email: emailConfig.noReply,
            from_name: emailConfig.noReplyName,
            track_opens: true,
            track_clicks: true
        });
    }
    return emailOptions;

}

/**
 * Create email transport TODO pull out each one into own module to allow plugins?
 *
 * @returns {*}
 * @private
 */
Tattle.prototype._buildTransport = function() {

    var client = this._client;
    var clientOptions = this._clientOptions;

    if (client === "nodemailer") {
        return nodemailer.createTransport("SES", clientOptions);
    }
    else if (client === "sendgrid") {
        return sendgrid(clientOptions.username, clientOptions.apiKey);
    }
    else if (client === "mandrill") {
        return new mandrill.Mandrill(clientOptions.apiKey);
    }
};

/**
 * Decide which email client to use
 *
 * @private
 */
Tattle.prototype._setClient = function() {

    var config = this._config;
    var client;

    if (config.env === "local") {
        client = "nodemailer";
    }
    else if (config.env === "production") {

        if (config.email && config.email.sendgrid) {
            client = "sendgrid";
        }
        else if (config.email && config.email.mandrillApiKey) {
            client = "mandrill";
        }
    }
    else {
        throw new Error("Invalid config. Config requires a client");
    }
    this._client = client;
};

/**
 * Assemble client options for the client type
 *
 * @private
 */
Tattle.prototype._setClientOptions = function() {

    var config = this.config;
    var client = this._client;
    var clientOptions;

    if (client === "nodemailer") {
        clientOptions = {
            AWSAccessKeyID: process.env.AWS_ACCESS_KEY_ID,
            AWSSecretKey: process.env.AWS_SECRET_KEY
        };
    }
    else if (client === "sendgrid") {
        clientOptions = {
            username: config.email.sendgrid.username,
            apiKey: config.email.sendgrid.apiKey
        };
    }
    else if (client === "sendgrid") {
        clientOptions = {
            apiKey: config.email.mandrillApiKey
        };
    }

    this._clientOptions = clientOptions;
};

/**
 *
 * @type {Tattle}
 */
module.exports = Tattle;

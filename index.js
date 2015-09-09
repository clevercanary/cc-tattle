"use strict";

var sendgrid = require("sendgrid");
var mandrill = require("mandrill-api");
var nodemailer = require("nodemailer");
var _ = require("lodash");
var ccExpressUtils = require("cc-express-utils");

/**
 * @constructor Tattle
 */
function Tattle() {}

/**
 * Configure Tattle and set up uncaught exception handler
 *
 * @param config {{env: string, email: {admins: string[], noReply: string, noReplyName: string}}}
 * @param mongoose {"mongoose"}
 */
Tattle.prototype.configure = function(config, mongoose) {
    this._config = config;
    this._config.client = getClient.call(this, config);
    this._clientOptions = getClientOptions.call(this, config);
    this.configureMongoose(mongoose);
    this.handleUncaughtException();
};

/**
 * Set properties on this._config
 *
 * @param key {string}
 * @param val {*}
 */
Tattle.prototype.set = function(key, val) {
    // need to deal with dot notation
    this._config[key] = val;
};

/**
 * Get values from this._config
 *
 * @param key {string}
 * @returns {*|undefined}
 */
Tattle.prototype.get = function(key) {
    // need to deal with dot notation
    return this._config[key] || undefined;
};

/**
 * Configure mongoose
 *
 * @param mongoose {"mongoose"}
 */
Tattle.prototype.configureMongoose = function(mongoose) {
    this._mongoose = mongoose;
    this.registerMongooseModel();
    this._ErrorLog = mongoose.model("ErrorLog");
};

/**
 * Register ErrorLog model
 */
Tattle.prototype.registerMongooseModel = function() {

    var mongoose = this._mongoose;
    var Schema = mongoose.Schema;
    var ErrorLogSchema = new Schema({
        user: Schema.ObjectId,
        userAgent: String,
        method: String,
        url: String,
        query: String,
        body: String,
        stack: String,
        createdAt: {
            type: Date,
            default: new Date()
        }
    });
    mongoose.model("ErrorLog", ErrorLogSchema);
};

/**
 * Handle express errors
 *
 * @returns {Function}
 */
Tattle.prototype.expressErrorHandler = function() {

    var ErrorLog = this._ErrorLog;
    var self = this;

    return function(error, req, res, next) {
        console.error(error);
        var userId;
        if (req.user) {
            userId = req.user._id;
        }

        ErrorLog.create({
            user: userId,
            userAgent: req.headers["user-agent"],
            method: req.method,
            url: req.originalUrl,
            query: JSON.stringify(req.query),
            body: JSON.stringify(req.body),
            stack: error.stack,
            createdAt: new Date()
        }, function(dbErr, errLog) {

            if (dbErr) {
                return next(dbErr);
            }
            var errLogId = errLog._id.toString();
            self.emailError(error, errLogId, ccExpressUtils.setupResponseCallback(res));
        });
    };
};

/**
 * Handle uncaught exceptions
 */
Tattle.prototype.handleUncaughtException = function() {

    var self = this;
    var ErrorLog = this._ErrorLog;

    process.on("uncaughtException", function(error) {
        console.error(error);

        ErrorLog.create({
            stack: error.stack,
            createdAt: new Date()
        }, function(dbErr, errLog) {

            var errLogId = errLog._id.toString();
            self.emailError(error, errLogId, process.exit);
        });
    });
};

/**
 * Construct email client transport
 *
 * @param client {string}
 * @param clientOptions {{username: string|undefined, apiKey: string|undefined}}
 * @returns {*}
 */
function getTransport(client, clientOptions) {
    if (client === "nodemailer") {
        return nodemailer.createTransport("SES", clientOptions);
    }
    else if (client === "sendgrid") {
        return sendgrid(clientOptions.username, clientOptions.apiKey);
    }
    else if (client === "mandrill") {
        return new mandrill.Mandrill(clientOptions.apiKey);
    }
}

/**
 * Send email containing error log ID
 *
 * @param error {Error}
 * @param errLogId {string | ObjectId}
 * @param next {Function}
 * @returns {*}
 */
Tattle.prototype.emailError = function(error, errLogId, next) {

    var config = this._config;
    var clientOptions = this._clientOptions;
    var client = config.client;
    var transport = getTransport(client, clientOptions);
    var emailOptions = getEmailOptions.call(this);

    emailOptions.html = "Error id: " + errLogId; // custom html?

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
            function(res) {
                next(true);
            },
            function(err) {
                console.log(err);
                next(false);
            });
    }
};

/**
 * Decide which email client to use
 *
 * @param config {{env: string, email: {sendgrid: Object, mandrillApiKey: string|undefined}}}
 * @returns {*}
 */
function getClient(config) {


    if (config.env === "local") {
        return "nodemailer";
    }
    else if (config.env === "production") {

        if (config.email && config.email.sendgrid) {
            return "sendgrid";
        }
        else if (config.email && config.email.mandrillApiKey) {
            return "mandrill";
        }
    }
}

/**
 *
 * @param config {Object}
 * @returns {*}
 */
function getClientOptions(config) {

    var client = config.client;

    if (client === "nodemailer") {
        return {
            AWSAccessKeyID: process.env.AWS_ACCESS_KEY_ID,
            AWSSecretKey: process.env.AWS_SECRET_KEY
        };
    }
    else if (client === "sendgrid") {
        return {
            username: config.email.sendgrid.username,
            apiKey: config.email.sendgrid.apiKey
        };
    }
    else if (client === "sendgrid") {
        return {
            apiKey: config.email.mandrillApiKey
        };
    }
}

/**
 * Build email object
 *
 * @returns {{to: string[], subject: string}}
 */
function getEmailOptions() {

    var config = this._config;
    var client = config.client;
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
 * @type {Tattle}
 */
module.exports = new Tattle();

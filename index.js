"use strict";

var sendgrid = require("sendgrid");
var mandrill = require("mandrill-api");
var nodemailer = require("nodemailer");
var _ = require("lodash");
var ccExpressUtils = require("cc-express-utils");


function ErrorHandler(options) {

    validateOptions(options);
    options.collection = "errorlogs";
    this._options = options;
    this._env = options.env;

    if (options.mongooseConnection.readyState === 1) {
        this._db = options.mongooseConnection.db;
    }

    var collection = this._db.collection(options.collection);
    this._collection = collection;

    if (options.clientName === "sendgrid") {
        this._client = sengrid(options.clientOptions.username, options.clientOptions.apiKey);
    }
    else if (options.clientName === "mandrill") {
        this._client = new mandrill.Mandrill(options.clientOptions.apiKey);
    }

    var self = this;
    /**
     * Handle process killing errors
     */
    process.on("uncaughtException", function (error) {

        collection.insert({
            stack: error.stack,
            createdAt: new Date()
        }, function (dbErr, mongoRes) {
            console.error(error);

            var errLogId = mongoRes.ops[0]._id.toString()
            emailError.call(self, error, errLogId, function() {
                process.exit();
            });
        });
    });
}

/**
 * Handle express non-terminating errors
 *
 * @returns {Function}
 */
ErrorHandler.prototype.handleServerErrors = function() {

    var collection = this._collection;
    var self = this;

    return function(error, req, res, next) {

        collection.insert({
            user: req.user._id,
            userAgent: req.headers["user-agent"],
            method: req.method,
            url: req.originalUrl,
            query: JSON.stringify(req.query),
            body: JSON.stringify(req.body),
            stack: error.stack,
            createdAt: new Date()
        }, function(dbErr, mongoRes) {

            var errLogId = mongoRes.ops[0]._id.toString()
            console.error(error);
            emailError.call(self, error, errLogId, ccExpressUtils.setupResponseCallback(res));
        });
    }
}


/**
 * Send email to admins with an error log ID
 *
 * @param error {Error}
 * @param errId {string | ObjectId}
 * @param next {Function}
 */
function emailError(error, errId, next) {

    var env = this._env || "local";
    var client = this._client;
    var options = this._options || {};
    var clientName = options.clientName;
    var clientOptions = options.clientOptions;

    var mailOptions = {
        to: clientOptions.admins,
        subject: "Application Error",
        html: "Error id: " + errId.toString()
    }

    // if debug mode, email through nodemailer
    if (env === "local" && options.debug) {

        _.extend(mailOptions, {
            from: "\"" + clientOptions.noReplyName + "\" <" + clientOptions.noReply + ">"
        });
        var transport = nodemailer.createTransport("SES", {
            AWSAccessKeyID: process.env.AWS_ACCESS_KEY_ID,
            AWSSecretKey: process.env.AWS_SECRET_KEY
        });

        return transport.sendMail(mailOptions, function(transportError) {

            if (transportError) {
                console.log("transport error:\n");
                console.log(transportError);
                next(transportError);
            }
            transport.close();
            next(error);
        });
    }

    if (env === "production") {

        if (clientName === "sendgrid") {

            _.extend(mailOptions, {
                from: clientOptions.from,
                fromname: clientOptions.fromname
            });
            return client.send(mailOptions);
        }
        else if (clientName === "mandrill") {

            _.extend(mailOptions, {
                from_email: clientOptions.noReply,
                from_name: clientOptions.noReplyName,
                track_opens: true,
                track_clicks: true
            });
            return client.messages.send({message: mailOptions});
        }
    }
}

/**
 * Validate options
 *
 * @param options
 */
function validateOptions(options) {

    var requiredKeys = ["mongooseConnection", "clientName", "clientOptions", "env"];

    checkRequiredKeys(options, requiredKeys);
    var emailKeys = ["admins", "noReply", "noReplyName"];
    var emailClient = options.clientName.toLowerCase();

    if (options.debug) {
        options.clientName = "nodemailer"
        checkRequiredKeys(options.clientOptions, emailKeys)
    }

    if (emailClient === "sendgrid") {
        checkRequiredKeys(options.clientOptions, ["username", "apiKey"].concat(emailKeys));
    }
    else if (emailClient === "mandrill") {
        checkRequiredKeys(options.clientOptions, ["apiKey"].concat(emailKeys));
    }
}

/**
 * Check object for required options
 *
 * @param options
 * @param keys
 */
function checkRequiredKeys(options, keys) {

    var errKeys = [];

    keys.forEach(function(key) {

        if (!options[key]) {
            errKeys.push(key);
        }
    });

    if (errKeys.length) {
        throw new Error("\"" + errKeys.join(", ") + "\" is required");
    }
}

exports.ErrorHandler = ErrorHandler;

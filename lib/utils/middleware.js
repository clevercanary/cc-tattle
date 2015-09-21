/**
 * Middleware
 */
"use strict";

/**
 * Dependencies
 */
var path = require("path");

/**
 * @type {{auth: Function, requireRole: Function, parseQueryString: Function, angularPartials: Function}}
 */
module.exports = {

    /**
     * Verify the user session has the required role
     *
     * @param role {...string}
     * @returns {Function}
     */
    requireRole: function (role) {

        // Handle the case where more than one role is specified
        if ( arguments.length === 1 ) {
            role = [role];
        }
        else {
            role = argsToArray(arguments);
        }

        return function (req, res, next) {

            var userCategory = "";
            var error;

            if (req.user && req.user.role) {
                userCategory = getUserRole(req.user.role);
            }

            if (!req.isAuthenticated()) {

                // User has not been authenticated - return 401
                error = new Error("User not authenticated.");
                error.status = 401;
                return next(error);
            }
            else if ( role.indexOf(userCategory) > -1 ) {

                // User has the expected role - nothing to see here!
                return next();
            }
            else {

                // User is not authorized - return 403
                error = new Error("User not authorized.");
                error.status = 403;
                return next(error);
            }
        };
    },

    /**
     * Convert filters/sorts/populates arrays of JSON to objects
     */
    parseQueryString: function (req, resp, next) {

        var filters = req.query.filters;
        if (filters && filters.length) {

            req.query.filters = parseArrayAsJSON(filters);
        }

        var sorts = req.query.sorts;
        if (sorts && sorts.length) {

            req.query.sorts = parseArrayAsJSON(sorts);
        }

        var populates = req.query.populates;
        if (populates && populates.length) {

            req.query.populates = parseArrayAsJSON(populates);
        }

        next();
    }
};

/**
 * PRIVATES
 */

/**
 * Convert Array of JSON to array of objects
 *
 * @param array {Array}
 * @returns {Array}
 */
function parseArrayAsJSON(array) {

    if (!Array.isArray(array)) {
        array = [].concat(array);
    }

    return array.map(function (array) {
        return JSON.parse(array);
    });
}

/**
 * Convert schedulers/surgeons to users
 *
 * @param role {string}
 * @returns {string}
 */
function getUserRole(role) {

    if (role === "REP") {
        return "REP";
    }
    else if (role === "ADMIN") {
        return "ADMIN";
    }
    else {
        return "USER";
    }
}

/**
 * Convert arguments object to array
 *
 * @param args {Arguments}
 * @returns {Array}
 */
function argsToArray(args) {

    var arr = [];
    for (var i = 0; i < args.length; i++) {
        arr.push(args[i]);
    }
    return arr;
}

/**
 * Error Log App
 */
(function() {
    "use strict";

    angular.module("ccTattle", [])
    /**
     * Wrapper for AJAX Post and stacktrace.js
     */
        .factory("TraceService",function($window) {
            return {
                print: printStackTrace, // stacktrace.js function
                post: function (errMsg, trace, cause) {

                    cause = cause || "";

                    var data = {
                        url: $window.location.href,
                        message: errMsg,
                        type: "exception",
                        stackTrace: trace.join("\n"),
                        cause: cause
                    };

                    var req = new XMLHttpRequest();
                    req.open("POST", "/api/errorlogs", true);
                    req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                    req.send(JSON.stringify(data));
                }
            };
        })
    /**
     * Exception handler
     */
        .factory("ExceptionLoggingService", function($log, $window, TraceService) {

            return function(exception, cause) {

                // preserve default functionality
                $log.error.apply($log, arguments);

                try {

                    var errorMessage = exception.toString();
                    var stackTrace = TraceService.print({error: exception});
                    TraceService.post(errorMessage, stackTrace, cause);
                }
                catch (loggingError) {

                    $log.warn("Error logging failed");
                    $log.log(loggingError);
                }
            };
        })
    /**
     * Error Log DAO for 'Find' queries
     */
        .factory("ErrorLogDAO", function($resource) {

            return $resource("/api/errorlogs/:id", {
                id: "@id"
            }, {
                findAllErrorLogs: {
                    method: "GET",
                    url: "/api/errorlogs",
                    isArray: true
                },
                findErrorLogById: {
                    method: "GET",
                    url: "/api/errorlogs/:id",
                    isArray: false
                }
            });
        })
    /**
     * Override default exception handling
     */
        .provider("$exceptionHandler", {
            $get: function(ExceptionLoggingService) {
                return ExceptionLoggingService;
            }
        });
})();

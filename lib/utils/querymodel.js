//
// CC query model - models Mongoose query
//

"use strict";

// Constants...
var FILTER_TYPES = {
    EQUALS: "EQUALS",
    IN: "IN",
    NOT: "NOT",
    OR: "OR",
    AND: "AND",
    REGEXP: "REGEXP",
    GT: "GT",
    LT: "LT",
    MATCH: "MATCH"
};

//
// Function constructor for query builder object
//
// @param req Request object, contains filters, sorts, offset, limit etc specified from FE.
//
var QueryModel = function (req) {

    if ( req ) {

        this.paginated = !!(req.query.offset || req.query.limit);
        this.sortable = true;
        init.call(this, req.query);
    }
};

//
// Returns true if there is a function (eg COUNT) associated with this
// query
//
QueryModel.prototype.isHasFunction = function() {

    return !!this.fn;
};

//
// Set pagination flag
//
QueryModel.prototype.setPaginated = function(paginated) {

    this.paginated = paginated;
};

//
// Returns true if result set is to be paginated
//
QueryModel.prototype.isPaginated = function() {

    return this.paginated;
};

//
// Clear pagination
//
QueryModel.prototype.clearPagination = function() {

    this.offset = null;
    this.limit = null;
};

//
// Set sortable flag
//
QueryModel.prototype.setSortable = function(sortable) {

    this.sortable = sortable;
};

//
// Returns true if result set is to sortable
//
QueryModel.prototype.isSortable = function() {

    return this.sortable;
};

//
// Update this query model to match the specified query model
//
QueryModel.prototype.initFrom = function(fromQm) {

    this.paginated = fromQm.paginated;
    init.call(this, fromQm);
};

//
// Adding filters...
//

//
// Add EQUALS query filter query param to the array of filters
//
QueryModel.prototype.addEqualsQueryFilter = function(fieldName, value) {

    var filter = this.buildEqualsQueryFilter(fieldName, value);
    this.getFilters().push(filter);
};

//
// Add IN query filter query param to the array of filters
//
QueryModel.prototype.addInQueryFilter = function(fieldName, value) {

    var filter = this.buildInQueryFilter(fieldName, value);
    this.getFilters().push(filter);
};

//
// Add NOT query filter query param to the array of filters
//
QueryModel.prototype.addNotQueryFilter = function(fieldName, value) {

    var filter = this.buildNotQueryFilter(fieldName, value);
    this.getFilters().push(filter);
};

//
// Add OR query filter query param to the array of filters
//
QueryModel.prototype.addOrQueryFilter = function(conditions) {

    var filter = this.buildOrQueryFilter(conditions);
    this.getFilters().push(filter);
};

//
// Add AND query filter query param to the array of filters
//
QueryModel.prototype.addAndQueryFilter = function(conditions) {

    var filter = this.buildAndQueryFilter(conditions);
    this.getFilters().push(filter);
};

//
// ADD GT query filter query param to the array of filters
//
QueryModel.prototype.addGtQueryFilter = function(fieldName, value) {

    var filter = this.buildGtQueryFilter(fieldName, value);
    this.getFilters().push(filter);
};

//
// Add LT query filter to filter array
//
QueryModel.prototype.addLtQueryFilter = function(fieldName, value) {

    var filter = this.buildLtQueryFilter(fieldName, value);
    this.getFilters().push(filter);
};

//
// Add OR query filter query param to the array of filters
//
QueryModel.prototype.addRegexpQueryFilter = function(fieldName, regexpString) {

    this.getFilters().push({
        filterType: FILTER_TYPES.REGEXP,
        fieldName: fieldName,
        value: regexpString
    });
};

//
// Add MATCH query filter query param to the array of filters
//
QueryModel.prototype.addMatchQueryFilter = function(fieldName, value) {

    var filter = this.buildMatchQueryFilter(fieldName, value);
    this.getFilters.push(filter);
};

//
// Building filters...
//

//
// Add public method for building EQUALS filter - need this for example when
// creating OR filters
//
QueryModel.prototype.buildEqualsQueryFilter = function(fieldName, value) {

    return buildQueryFilter.call(this, FILTER_TYPES.EQUALS, fieldName, value);
};

//
// Add public method for building IN filter - need this for example when
// creating OR filters
//
QueryModel.prototype.buildInQueryFilter = function(fieldName, value) {

    return buildQueryFilter.call(this, FILTER_TYPES.IN, fieldName, value);
};

//
// Add public method for building NOT filter - need this for example when
// creating OR filters
//
QueryModel.prototype.buildNotQueryFilter = function(fieldName, value) {

    return buildQueryFilter.call(this, FILTER_TYPES.NOT, fieldName, value);
};

//
// Add public method for building GT filter
//
QueryModel.prototype.buildGtQueryFilter = function(fieldName, value) {

    return buildQueryFilter.call(this, FILTER_TYPES.GT, fieldName, value);
};

//
// Add public method for building GT filter
//
QueryModel.prototype.buildLtQueryFilter = function(fieldName, value) {

    return buildQueryFilter.call(this, FILTER_TYPES.LT, fieldName, value);
};

// Add public method for building MATCH filter - need for building Array
// element matching
//
QueryModel.prototype.buildMatchQueryFilter = function(fieldName, value) {

    return buildQueryFilter.call(this, FILTER_TYPES.MATCH, fieldName, value);
};

//
// Add public method for building AND filter - need this for building nested
// conditional queries
//
QueryModel.prototype.buildAndQueryFilter = function(conditions) {

    return buildConditionalQueryFilter.call(this, FILTER_TYPES.AND, conditions);
};

//
// Add public method for building OR filter - need this for building nested
// conditional queries
//
QueryModel.prototype.buildOrQueryFilter = function(conditions) {

    return buildConditionalQueryFilter.call(this, FILTER_TYPES.OR, conditions);
};

//
// Build populate query param
//
QueryModel.prototype.addPopulates = function(fieldName, childrenFieldNames) {

    this.getPopulates().push({
        fieldName: fieldName,
        childrenFieldNames: childrenFieldNames
    });
};

//
// Add sort order
//
QueryModel.prototype.addSort = function (fieldName, asc) {

    this.getSorts().push({
        fieldName: fieldName,
        asc: asc
    });
};

//
// Add select fields
//
QueryModel.prototype.addSelects = function (fields) {

    if ( !this.selected ) {
        this.selected = "";
    }
    this.selected += (" " + fields);
};

//
// Return filters, return empty array if no filters
// specified
//
QueryModel.prototype.getFilters = function() {

    if ( !this.filters ) {
        this.filters = [];
    }
    return this.filters;
};

//
// Return the specified function, if any
//
QueryModel.prototype.getFn = function() {

    return this.fn;
};

//
// Get limit
//
QueryModel.prototype.getLimit = function () {

    return this.limit;
};

//
// Get offset
//
QueryModel.prototype.getOffset = function () {

    return this.offset;
};

//
// Return all populates, return empty array if no populates specified
//
QueryModel.prototype.getPopulates = function() {

    if ( !this.populates ) {
        this.populates = [];
    }
    return this.populates;
};

//
// Return all sort orders, return empty array if no sort
// orders specified
//
QueryModel.prototype.getSorts = function() {

    if ( !this.sorts ) {
        this.sorts = [];
    }
    return this.sorts;
};

//
// Return select fields
//
QueryModel.prototype.getSelects = function() {

    if ( !this.selected ) {
        this.selected = "";
    }
    return this.selected;
};

//
// Get lean option
//
QueryModel.prototype.getLean = function() {

    if ( !this.lean ) {
        return false;
    }
    return this.lean;
};

//
// Setup query as a count function
//
QueryModel.prototype.setAsCountFunction = function() {

    this.fn = {
        name: "COUNT"
    };

    // Clear pagination
    this.clearPagination();
};

//
// Set limit
//
QueryModel.prototype.setLimit = function (limit) {

    this.limit = limit;
};

//
// Set offset
//
QueryModel.prototype.setOffset = function (offset) {

    this.offset = offset;
};

//
// Set as lean
//
QueryModel.prototype.setLean = function (lean) {

    this.lean = lean;
};

//
// PRIVATES
//

//
// Build query filter query param
//
function buildQueryFilter(filterType, fieldName, value) {

    return {
        filterType: filterType,
        fieldName: fieldName,
        value: value
    };
}

function buildConditionalQueryFilter(filterType, conditions) {

    return {
        filterType: filterType,
        conditions: conditions
    };
}

//
// Setup this query mode from the specified object
//
// @param obj Object to pull initial values from. Can be another
//            query model object, or a request object.
//
function init(obj) {
    /* jshint -W040 */

    this.filters = obj.filters || [];
    this.sorts = obj.sorts || [];
    this.populates = obj.populates || [];

    this.fn = obj.fn;

    this.offset = obj.offset;
    this.limit = obj.limit;
}

//
// Expose constructor function
//
module.exports = exports = QueryModel;

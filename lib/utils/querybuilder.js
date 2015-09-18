//
// CC Query builder
//

"use strict";

//
// Build complete query from query model
//
exports.buildQuery = function(query, qm) {

    // Build up query filters
    addFilters(query, qm.getFilters());

    // Add pagination
    if ( qm.isPaginated() ) {

        addPaging(query, {
            offset: qm.getOffset(),
            limit: qm.getLimit()
        });
    }

    // Check if we are doing a function query (eg COUNT) - if so, add the function
    if ( qm.isHasFunction( ) ) {
        addFunction(query, qm.getFn());
    }
    // Otherwise we"re doing a straight up "select" style query - add sorts,
    // populates etc
    else {

        if ( qm.isSortable() ) {
            addSortOrder(query, qm.getSorts());
        }

        addPopulates(query, qm.getPopulates());
        addSelects(query, qm.getSelects());
        addLean(query, qm.getLean());
    }
};

//
// Add specified filters to query object
//
// @param filters Array of filter objects, mapping fieldName to value.
// For example:
//
// [{
//   filterType: "EQUALS",
//   fieldName: "hospital",
//   value: "123ABC"
// }, {
//   filterType: "EQUALS",
//   fieldName: "cptCategory",
//   value: "ORTHOPEDIC"
// }, {
//   fieldType: "OR",
//   conditions: [{
//     fieldName: "organization",
//     value: "123zxc12as"
//   }]
// }]
//
//
/*
 db.cases.find({
 $or: [{
 "implants.backup": {
 "$in": [
 ObjectId("53f2c29b5737f1c4101be17a"),
 ObjectId("53f2c29b5737f1c4101be17e")
 ]
 }
 }, {
 "implants.rep._id": ObjectId("53f2c29c5737f1c4101be189")
 }]
 });
 */
//
//
function addFilters(query, filters) {
    /* jshint maxstatements: 30 */

    for (var i = 0; i < filters.length; i++) {

        var filter = filters[i];
        var value;
        var conditions;

        if (filter.filterType === "EQUALS") {

            query.where(filter.fieldName).equals(filter.value);
        }
        else if( filter.filterType === "REGEXP" ) {

            value = filter.value || "";
            var regexVal = new RegExp(value,  "i");
            query.where(filter.fieldName).regex(regexVal);
        }
        else if ( filter.filterType === "IN" ) {

            value = filter.value;
            if (!Array.isArray(value)) {
                value = [].concat(value);
            }
            query.where(filter.fieldName).in(value);
        }
        else if (filter.filterType === "OR") {

            conditions = parseConditionalQueries(filter);
            query.or(conditions);
        }
        else if (filter.filterType === "AND") {

            conditions = parseConditionalQueries(filter);
            query.and(conditions);
        }
        else if ( filter.filterType === "NOT" && Array.isArray(filter.value) ) {

            query.where(filter.fieldName).nin(filter.value);
        }
        else if (filter.filterType === "NOT") {

            query.where(filter.fieldName).ne(filter.value);
        }
        else if (filter.filterType === "LT") {

            query.where(filter.fieldName).lt(filter.value);
        }
        else if (filter.filterType === "GT") {

            query.where(filter.fieldName).gt(filter.value);
        }
        else if (filter.filterType === "MATCH") {

            query.where(filter.fieldName).elemMatch(filter.value);
        }
        else {

            console.error("Unrecognized filter type in QueryBuilder.addFilters: " + filter.filterType);
            // TODO(dave) throw error?
        }
    }
}
exports.addFilters = addFilters;

//
// Add specified sort order to query object
//
// @param sortOrder Array of sort order objects specified in sort order.
// For example:
//
// [{
//    fieldName: "cptCategory",
//    asc: true
// }, {
//    fieldName: "hospital",
//    asc: false
// }]
//
function addSortOrder(query, sorts) {

    if (!sorts.length) {
        return;
    }

    var sortConfig = {};
    for (var i = 0; i < sorts.length; i++) {

        var sort = sorts[i];
        sortConfig[sort.fieldName] = sort.asc ? "asc" : "desc";
    }

    query.sort(sortConfig);
}
exports.addSortOrder = addSortOrder;

//
// Add populate clause to query
//
function addPopulates(query, populates) {

    if ( !populates || !populates.length ) {
        return;
    }

    for (var i = 0; i < populates.length; i++) {

        var populate = populates[i];

        if ( populate.childrenFieldNames && populate.childrenFieldNames.length ) {

            query.populate({
                path: populate.fieldName,
                select: populate.childrenFieldNames.join(" ")
            });
        }
        else {
            query.populate(populate.fieldName);
        }

    }
}
exports.addPopulates = addPopulates;

//
// Adds paging
//
function addPaging(query, paging) {

    // no paging fetch all the rows
    if (!paging || !paging.offset || !paging.limit) {
        return;
    }

    // starting page
    var offset = parseInt(paging.offset, 10);

    // end page
    var limit = parseInt(paging.limit, 10);

    query.skip(offset).limit(limit);
}
exports.addPaging = addPaging;

//
// Add count function to query
//
function addFunction(query, fn) {

    if ( !fn ) {
        return;
    }

    if ( fn.name === "COUNT" ) {

        query.count();
    }
}
exports.addFunction = addFunction;


//
// Add field selection to query
//
function addSelects(query, selects) {

    if ( !selects ) {
        return;
    }

    query.select(selects);
}
exports.addSelects = addSelects;


//
// Add lean option
//
function addLean(query, lean) {

    if ( !lean ) {
        return;
    }
    query.lean(lean);
}

//
// PRIVATES
//

//
// Parse OR/AND queries
//
function parseConditionalQueries (filter) {

    var conditions = [];
    var condition;
    for (var j = 0; j < filter.conditions.length; j++) {

        var conditionDefinition = filter.conditions[j];

        if (conditionDefinition.filterType === "EQUALS") {

            condition = {};
            condition[conditionDefinition.fieldName] = conditionDefinition.value;
            conditions.push(condition);
        }
        else if (conditionDefinition.filterType === "IN") {

            condition = {};
            condition[conditionDefinition.fieldName] = {
                "$in": conditionDefinition.value
            };
            conditions.push(condition);
        }
        else if (conditionDefinition.filterType === "MATCH") {

            condition = {};
            condition[conditionDefinition.fieldName] = {
                $elemMatch: conditionDefinition.value
            };
            conditions.push(condition);
        }
    }
    return conditions;
}

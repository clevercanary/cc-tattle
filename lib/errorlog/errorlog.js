var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var DEFAULT_STRING = {
    type: String,
    default: ""
}

var ErrorLogSchema = new Schema({
    user: Schema.ObjectId,
    userAgent:  DEFAULT_STRING,
    method: DEFAULT_STRING,
    url: DEFAULT_STRING,
    query: DEFAULT_STRING,
    body: DEFAULT_STRING,
    stack: DEFAULT_STRING,
    client: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: new Date()
    }
});

module.exports = mongoose.model("ErrorLog", ErrorLogSchema);

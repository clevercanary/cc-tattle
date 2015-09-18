var mongoose = require("mongoose");
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

module.exports = mongoose.model("ErrorLog", ErrorLogSchema);

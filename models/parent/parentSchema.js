var mongoose = require('mongoose')
var ParentSchema = new mongoose.Schema({
    email: {type: String, required: true, index : {unique: true}},
    username: { type: String, required: true},
    password:  { type: String, required: true},
    notifications: [{ type: mongoose.Schema.ObjectId, ref: 'notifications' }]
});


module.exports = ParentSchema



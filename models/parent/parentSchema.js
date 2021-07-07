var mongoose = require('mongoose')
var ParentSchema = new mongoose.Schema({
    email: {type: String, required: true, index : {unique: true}},
    username: { type: String, required: true},
    password:  { type: String, required: true}
});


module.exports = ParentSchema



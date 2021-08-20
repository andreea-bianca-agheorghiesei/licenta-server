var mongoose = require('mongoose')

var ZoneSchema = new mongoose.Schema({
    // name : {type: String, required: true, index: {unique: true}},
    name: {type: String, required: true},
    coordinates: [],
    radius: Number
})

module.exports = ZoneSchema
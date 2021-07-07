var mongoose = require('mongoose')

var ZoneSchema = new mongoose.Schema({
    name : {type: String, required: true, index: {unique: true}},
    coordinates: [],
    radius: Number
})

module.exports = ZoneSchema
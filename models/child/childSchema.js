var mongoose = require('mongoose')
var DeviceSchema = require('./deviceSchema')
var ZoneSchema = require('./zoneSchema')

var ChildSchema = new mongoose.Schema({
    name: {type: String},
    gender: {type: String, enum: ['boy', 'girl']},
    devices: [DeviceSchema],
    zones: [ZoneSchema]
})



module.exports = ChildSchema
var mongoose = require('mongoose')

var DeviceSchema = new mongoose.Schema({
    token: {type: String, required: true, index: {unique: true}},
    location: {
         type: {type: String, default: "Point"},
         coordinates: []
        },
    activated: {type: Boolean}   
}, 
{timestamps: true});



module.exports = DeviceSchema

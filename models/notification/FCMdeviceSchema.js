var mongoose = require('mongoose')

var FCMdeviceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.ObjectId, ref: 'tutores' },
    fcmToken: {type:String, index: {unique:true}},
    active: {type: Boolean},
})

module.exports = mongoose.model('fcmDevices', FCMdeviceSchema );
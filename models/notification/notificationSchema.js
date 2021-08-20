var mongoose = require('mongoose')

var NotificationSchema = new mongoose.Schema({ 
    userId: { type: mongoose.Schema.ObjectId, ref: 'tutores' },
    title: {type:String},
    message: {type: String},
    read: {type: Boolean},
    timestamp: {type: Date},s
})

module.exports = mongoose.model('notifications', NotificationSchema);
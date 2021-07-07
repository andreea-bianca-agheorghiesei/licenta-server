var mongoose = require('mongoose')
var ParentSchema = require('../parent/parentSchema')
var ChildSchema = require('../child/childSchema')
var TutoreSchema = new mongoose.Schema({
    parents: [ParentSchema],
    children: [ChildSchema]
})

module.exports = mongoose.model('tutores', TutoreSchema )

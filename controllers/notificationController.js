var express = require('express');
router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

router.use(bodyParser.urlencoded({extended:true}));
router.use(bodyParser.json())

var FCMDevice = require('../models/notification/FCMdeviceSchema');
var verifyJWT = require('../auth/verifyJWT');

var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require ('../config.js');


router.post('/', verifyJWT, (req, res, next) => {
    //ar trebui sa primesc fcm tokenul 
    // si sa il adaug in baza de date
    var fcm = new FCMDevice({
        userId: req.id,
        fcmToken: req.body.fcmToken,
        active: true
    });

    fcm.save((err, fcm) => {
        if(err) return res.status(500).send({message: err.message});      
        res.status(200).send({message : 'fcm token registered'});
    })
})
module.exports = router;
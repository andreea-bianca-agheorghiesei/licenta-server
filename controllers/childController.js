var express = require('express');
router = express.Router();
var bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({extended:true}));
router.use(bodyParser.json())

var Tutore = require('../models/tutore/tutoreSchema');
var verifyJWT = require('../auth/verifyJWT');

var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require ('../config.js');

// se logheaza copilul cu token-ul 
// cand introduce copilul tokenul in aplicatie
router.put('/register', (req, res) => {
    Tutore.findOneAndUpdate(
        {
            'children.devices.token' : req.body.token
        },
        {
            $set: {'children.0.devices.$.activated' : true}
        },
        {
            new: true,
            projection: {'children._id' : 1}
        },
       
        (err, result) => {
            if(err) 
                {
                console.log(err)
                return res.status(500).send('Inregistrare nu s-a putut efectua');}
            
            if(!result ) return res.status(401).send({auth: false, JWTtoken: null})
            var token = jwt.sign(
                {
                id:result.children[0]._id},
                config.secret, 
                {expiresIn: 86400}
                );
        
            res.status(200).send({auth:true, JWTtoken: token});
        }
    )
});

router.put('/login', (req, res) => {
    Tutore.findOne(
        {
            'children.devices.token' : req.body.token
        },
        
       
        (err, result) => {
            if(err) 
                {
                console.log(err)
                return res.status(500).send({auth: false, JWTtoken: null});
                }
            
            if(!result ) return res.status(401).send({auth: false, JWTtoken: null})
            var token = jwt.sign(
                {
                id:result.children[0]._id},
                config.secret, 
                {expiresIn: 86400}
                );
        
            res.status(200).send({auth:true, JWTtoken: token});
        }
    )
});

router.put('/sendLocation', verifyJWT, (req, res, next) =>{
    // jwt-ul pentru copil + token ul device-ului 
    Tutore.findOneAndUpdate(
        {
            'children.devices.token' : req.body.token
        },
        {
            $set: {'children.0.devices.$.location.coordinates' : req.body.coordinates}
        },
       
        (err, result) => {
            if(err) 
                {
                console.log(err)
                return res.status(500).send('Update-ul nu s-a putut efectua');
                }
        
        
            res.status(200).send('Locatia a fost updatata');
        }
    )
})

module.exports = router;
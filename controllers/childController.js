var express = require('express');
router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

router.use(bodyParser.urlencoded({extended:true}));
router.use(bodyParser.json())

var Tutore = require('../models/tutore/tutoreSchema');
var Notification = require('../models/notification/notificationSchema');
var Child= require('../models/child/childSchema');
var verifyJWT = require('../auth/verifyJWT');

var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require ('../config.js');

// se logheaza copilul cu token-ul 

router.put('/register', (req, res) => {
    console.log(req.body)
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
                return res.status(500).send({message: err.message});}
            
            if(!result ) return res.status(401).send({auth: false, JWTtoken: null})
            var token = jwt.sign(
                {
                id:req.body.token},
                config.secret, 
                {expiresIn: 86400}
                );
        
            res.status(200).send({auth:true, JWTtoken: token});
        }
    )
});

router.post('/login', (req, res) => {
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
                id:req.body.token},
                config.secret, 
                {expiresIn: 86400}
                );
        
            res.status(200).send({auth:true, JWTtoken: token});
        }
    )
});

router.put('/sendLocation',verifyJWT, async (req,res, next) =>{
    // jwt-ul pentru copil + token ul device-ului 
    // console.log(req.body)
    // console.log(req.id)
    // let long =  parseFloat(req.body.coordinates[0]);
    // let lat =  parseFloat(req.body.coordinates[1]);
    // Tutore.findOneAndUpdate(
    //     {
    //         'children.devices.token' : req.id
    //     },
    //     {
    //         $set: {'children.0.devices.$.location.coordinates' :  [ long, lat] }
    //     },
    //     {
    //         projection: {'children.name.$' : 1}
    //     },      
    //     (err, result) => {
    //         if(err) 
    //             {
    //             console.log(err)
    //             return res.status(500).send('Update-ul nu s-a putut efectua');
    //             }      
    //         if(!result) return res.status(404).send({message: 'not found'})           
    //         console.log( 'in update location' + " " + result);
    //         res.status(200).send('Locatia a fost updatata');
    //       //  createNotifications(req, instersectedZones);
    //     }
    // );


    console.log('sunt in update location')
    
   getZoneIntersected(req)
        .then((entered) => {
            console.log(entered);
        }).catch((err) => {

        })
    
});


const getZoneIntersected =  (req) => {
  Tutore.find(
        {
            'children.devices.token' : req.id
        }, 
        {
            'children.zones.$' : 1,
            '_id' : 0
        },
         (err, result) => {
            var zones = result[0].children[0].zones;
            var enteredZone = []
            zones.forEach( zone => {
                console.log('suntem in for la zona: ' + zone.name)
                Tutore.find(
                {
                    'children.devices.token' : req.id,
                    'children.devices.location' : {
                        '$geoWithin': {
                            '$centerSphere': [ zone.coordinates, zone.radius/(6378*1000)]
                            }
                        }
                },
                {
                    'children.devices.location.$' : 1
                },
                (err, result) => {
                    // daca am un rezultat inseamna ca locatia introdusa mai devreme se afla intr-o zona
                    if(result[0]) 
                        {
                            console.log(JSON.stringify(result[0]));
                            enteredZone.push(zone);
                        }
                });
            });

            return enteredZone;
        });
}


function getActiveRooms(io) {
    // Convert map into 2D list:
    // ==> [['4ziBKG9XFS06NdtVAAAH', Set(1)], ['room1', Set(2)], ...]
    const arr = Array.from(io.sockets.adapter.rooms);
    // Filter rooms whose name exist in set:
    // ==> [['room1', Set(2)], ['room2', Set(2)]]
    const filtered = arr.filter(room => !room[1].has(room[0]))
    // Return only the room name: 
    // ==> ['room1', 'room2']
    const res = filtered.map(i => i[0]);
    return res;
}

module.exports = router;
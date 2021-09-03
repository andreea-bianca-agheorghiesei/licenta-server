var express = require('express');
router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

router.use(bodyParser.urlencoded({extended:true}));
router.use(bodyParser.json())

var Tutore = require('../models/tutore/tutoreSchema');
var FcmDevices = require('../models/notification/FCMdeviceSchema');
var Notification = require('../models/notification/notificationSchema');
var verifyJWT = require('../auth/verifyJWT');

var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require ('../config.js');


// logarea parintelui 

router.post('/login', (req, res) => {  
    console.log(req.body);
    Tutore.findOne( 
        { "parents.email" : req.body.email },
        (err, tutore) => {
            if(err) return res.status(500).send('Error on the server');
            if(!tutore) return res.status(404).send({auth:false, token: null});

            var passwordIsValid = bcrypt.compareSync(req.body.password, tutore.parents[0].password)            
            if(!passwordIsValid)
                return res.status(401).send({auth:false, token: null});
            
            var token = jwt.sign(
                {id:tutore.parents[0]._id},
                config.secret, 
                {expiresIn: 86400}
                );
            var username = tutore.parents[0].username
            res.status(200).send({ JWTtoken: token, username:username});
          
        });   
  
});

// inregistrarea parintelui (parinte care nu a primit invitatie pentru a urmari impreuna cu un alt parinte copii inregistrati deja din aplicatie)

router.post('/register', (req,res) => {
    Tutore.findOne( 
        { "parents.email" : req.body.email },
        (err, tutore) => {
            if(err) return res.status(500).send('Error on the server');
            if(tutore) return res.status(409).send('Account already in use'); 
    
    var hashedPassword = bcrypt.hashSync(req.body.password, 8)
    var tutore = new Tutore({
        parents: [
            {
                email: req.body.email,
                username: req.body.username,
                password: hashedPassword
            }
        ],
        children : []
    });

    tutore.save((err, tutore) => {
        if(err) return res.status(500).send({message: err.message})

        var token = jwt.sign (
            {id: tutore.parents[0]._id},
            config.secret,
            {expiresIn: 86400}
        );
        res.status(201).send({auth:true, JWTtoken: token});
    });
    });    
});

router.post('/logout', (req, res) => {
    res.status(200).send({ auth: false, JWTtoken: null });
})

// adaugare copil (cu token-ul pentru device)
//fortam sa puna nume, sex (din aplicatie mai bine)
router.post('/addChild', verifyJWT, (req, res , next) => {
    console.log(req.body)
    var token = generateNewToken();
    Tutore.updateOne(
        {
            "parents._id" : req.id,  
            "children.name": {$ne: req.body.childName}, 
            "children.devices.token": {$ne: token}     
        },
        {
            $push : {
                children: {
                    name: req.body.childName,
                    gender: req.body.gender,
                    devices: [
                        {
                            token: token,
                            location : {
                                type: "Point",
                                coordinates: []
                            },
                            activated: false                           
                        }
                    ],
                    zones: []
                }
            }
        }, 
        (err, child) => {
            if(err){
                console.log(err);
                return res.status(500).send('Inregistrare nu s-a putut efectua');
            } 
            if(child['nModified'] === 0 ) return res.status(400).send('Bad request')
            res.status(201).send({token:token});
        }
        )
});


function generateId(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

function tokenAlreadyExists (token){
    Tutore.findOne(
        {
            'children.devices.token': token
        },
        (err, token) => { 
            if(err) return true;
            if(token) return true;
            if(!token) return false;
        }
    )
}

function generateNewToken() { 
    var token = generateId(6);
    while(tokenAlreadyExists(token)){
        token = generateId(6);
    }
    return token;
}

router.put('/deleteChild', verifyJWT, (req, res , next) => {
    console.log(req.body)
    Tutore.updateOne(
        {
            "parents._id" : req.id,  
        },
        {
            $pull : {
                children: {
                    name: req.body.childName
                }
            }
        }, 
        (err, child) => {
            if(err){
                console.log(err);
                return res.status(500).send('Inregistrare nu s-a putut efectua');
            } 
            if(child['nModified'] === 0 ) return res.status(400).send('Bad request')
            res.status(201).send({token:token});
        }
        )
});


router.post('/addDevice', verifyJWT, (req, res, next) => {
    var token = generateNewToken();
    Tutore.updateOne(
        {
            "parents._id" : req.id,  
            "children.name": req.body.childName,
            "children.devices.token": {$ne: token}       
        },
        {
            $push : {
                "children.$.devices": 
                        {
                            token: token,
                            location : {
                                coordinates: []
                            },
                            activated: false
                        }
                }
        }, 
        (err, child) => {
            if(err){
                console.log(err);
                return res.status(500).send('Inregistrare nu s-a putut efectua');
            } 
            if(child['nModified'] === 0 ) return res.status(400).send('Bad request')
            res.status(201).send({token: token});
        }
        )
})

router.put('/updateToken', verifyJWT, (req, res, next) => {
    if (!req.body.childName)
        return res.status(400).send('Numele copilului nu a fost trimis')
})

// update fields pentru copil (nume/gender)
// ce primesc? token device? sau numele pe care il are acum??
// am id-ul de la parinte primit din verifyJWT
router.put('/setChildFields', verifyJWT, (req,res, next) => { 
    if (!req.body.childName)
        return res.status(400).send('Numele copilului nu a fost trimis')
    if ( !req.body.childGender && !req.body.newChildName)
        return res.status(400).send('Noile date despre copil nu au fost trimise')
    
    var replacement = {};
    if (req.body.newChildName) 
        replacement = { ...replacement, "children.$.name": req.body.newChildName}
    if (req.body.childGender) 
        replacement = { ...replacement, "children.$.gender": req.body.childGender}
    console.log(replacement)
    Tutore.updateOne(
        {
            "parents._id" : req.id,
            "children.name" : req.body.childName
        },
        {
            $set:  replacement  
        },
        (err, result) => {
            if(err)
               { 
                console.log(err) 
                return res.status(500).send('Nu s-au putut realiza modificarile.');
               }
            res.status(200).send('Detaliile despre copil au fost modificate.');
        }

    )
    
});



// adauga zona
router.post('/addZone', verifyJWT, (req,res, next) => {
    // am req.body id 
    // nu stiu daca trimit tokenul copilului sau numele, dar cred ca tokenul NUMELE ca zonele sunt pentru toate device-urile !!!!
    if (!req.body.childName || !req.body.zoneName || !req.body.radius || !req.body.coordinates)
        return res.status(400).send('Parametrii nu au fost trimisi corect.')
    console.log(req.body);
    let long =  parseFloat(req.body.coordinates[0]);
    let lat =  parseFloat(req.body.coordinates[1]);
    Tutore.updateOne(
        {
            "parents._id" : req.id, 
            "children.name" : req.body.childName,
            "children.zones.name" : {$ne: req.body.zoneName}       
        },
        {
            $addToSet : {
                "children.$.zones": {
                    name: req.body.zoneName, 
                    coordinates: [long, lat],
                    radius: req.body.radius
                }
            }
        }, 
        (err, zone) => {
            if(err) 
                {
                    console.log(err)
                    return res.status(500).send('Inregistrare nu s-a putut efectua');
                }
            console.log(zone)
            if(zone['nModified'] === 0 ) return res.status(400).send('Ceva nu merge')
            res.status(200).send('Zona a fost adaugata');
        }
    )    
})

// get locatie pentr un anumit copil/device

router.get('/getLoc/:childName', verifyJWT, (req, res, next) => {
    // console.log(req.id)
    // console.log(req.params)
    Tutore.findOne(
        {
            "parents._id" : req.id,
            "children.name" : req.params.childName
        },
        {
            "children.devices.location.coordinates.$" : 1
        }, 
        (err, coordinates) => {
            if(err) return res.status(500).send("Eroare server.");
            if(!coordinates) return res.status(404).send("Coordonatele nu se pot gasi");
            res.status(200).send({coordinates: coordinates.children[0].devices[0].location.coordinates});
        })
   
})

router.get('/getChildren', verifyJWT, (req, res, next) => {
    Tutore.find(
        {
            'parents._id' : req.id
        },
        {
            'children.gender': 1,
            'children.name': 1,
            'children.devices.activated' : 1,
            'children.devices.token': 1
       },
       (err,result) => {
           if(err) return res.status(500).send({message: err.message});
           if(!result) return res.status(404).send({message: 'not found'});
        //    console.log(JSON.stringify(result))
           res.status(200).send({children: result[0].children})
       }
    )
});

// trimite lista cu tokenuri pentru un copil
router.get('/getDevices', verifyJWT, (req,res, next) => {
    Tutore.find(
        {
            'parents._id' : req.id,
            'children.name' : req.body.childName
        },
        {
            'children.devices.token' : 1,
            // 'children.devices.activated': 1
        }, 
        (err, result) => {
            if(err) return res.status(500).send("Eroare server.");
            if(!result) return res.status(404).send("Lista cu device-uri nu se poate gasi.")
            console.log(JSON.stringify(result))
            res.status(200).send(result)
        }
    )
})

router.get('/childDevice/activated', verifyJWT, (req,res,next) => {

    let parent_id = mongoose.Types.ObjectId(req.id)
    let query = [
    {
        $match: {'parents._id' : parent_id}
    },
    {
        $unwind: '$children'
    },
    {
        $unwind: '$children.devices'
    },
    {
        $match: {'children.devices.token': 'BvDkZ0'}
    },
    {
        $project: {
                'children.devices.activated' : 1
            }
    }
];
  Tutore.aggregate(query)
    .then((result)=>{
        if(!result) return res.status(404).send({message: 'not found'});
        console.log(JSON.stringify(result));
        res.status(200).send({token_activated : result[0].children.devices.activated});
    })
    .catch((err) => {
        console.log(err);
        res.status(500).send({message: err.message});
    })
})

///////////////////// partea de notificari ////////////////////////////
router.get('/notifications',verifyJWT, (req,res,next) => {
    console.log('sunt in notifications')
    Tutore.findOne(
    {
        'parents._id' : req.id
    }
    ).populate({
        path: 'parents',
        populate: {
            path : 'notifications',
            model: 'notifications'
        }
    })
     .exec(
         (err, result) => {
            if(err) console.log(err);
            console.log(result.parents[0].notifications);
            res.status(200).send({notifications: result.parents[0].notifications})
        }
     )
     
})

router.put('/notifications', verifyJWT, (req, res, next) => {
    Notification.updateMany(
        {
            'userId' : req.id,
            'read': {$ne : true}
        },
        {
            $set: {'read': true}
        },
        {
            multi: true
        }
    ).then (result => {
        res.status(200).send({message: "Notifications read"});
    }).catch( err => {
        return res.status(400).send({message: err.message})
    })
})

module.exports = router;


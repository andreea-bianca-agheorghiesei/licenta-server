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


// logarea parintelui 

router.post('/login', (req, res) => {  
    console.log(req.body.password);
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
        if(err) return res.status(500).send('Inregistrare nu s-a putut efectua')

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

    console.log(req.body.token)
    Tutore.updateOne(
        {
            "parents._id" : req.id,           
        },
        {
            $push : {
                children: {
                    name: req.body.childName,
                    gender: req.body.gender,
                    devices: [
                        {
                            token: req.body.token,
                            location : {
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
            if(err) return res.status(500).send('Inregistrare nu s-a putut efectua');
            if(child['nModified'] === 0 ) return res.status(400).send('Ceva nu merge')
            res.status(201).send('Copilul a fost inregistrat');
        }
        )
});

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

// nu stiu aici sa fac
router.put('/updateToken', verifyJWT, (req, res, next) => {
    if (!req.body.childName)
        return res.status(400).send('Numele copilului nu a fost trimis')
})

// adauga zona
router.post('/addZone', verifyJWT, (req,res, next) => {
    // am req.body id 
    // nu stiu daca trimit tokenul copilului sau numele, dar cred ca tokenul NUMELE ca zonele sunt pentru toate device-urile !!!!
    if (!req.body.childName || !req.body.zoneName || !req.body.radius || !req.body.coordinates)
        return res.status(400).send('Parametrii nu au fost trimisi corect.')
    console.log(req.body);
    // Tutore.updateOne(
    //     {
    //         "parents._id" : req.id, 
    //         "children.name" : req.body.childName         
    //     },
    //     {
    //         $addToSet : {
    //             "children.$.zones": {
    //                 name: req.body.zoneName, 
    //                 coordinates: req.body.coordinates,
    //                 radius: req.body.radius
    //             }
    //         }
    //     }, 
    //     (err, zone) => {
    //         if(err) 
    //             {
    //                 console.log(err)
    //                 return res.status(500).send('Inregistrare nu s-a putut efectua');
    //             }
    //         res.status(200).send('Zona a fost adaugata');
    //     }
    // )
    res.status(200).send('Zona a fost adaugata');
    
})

// get locatie pentr un anumit copil/device
// VEZI CUM A FACUT SILVIU LEGATURA DINTRE COPIL SI PARINTE CU TOKEN-ul ALA
router.get('/getLoc/:childName', verifyJWT, (req, res, next) => {
    console.log(req.id)
    console.log(req.params)
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
    console.log('sunt in getChildren')
    Tutore.find(
        {
            'parents._id' : req.id
        },
        {
            "children.name" : 1, 
            "children.gender" : 1,
            "_id" : 0
        },
        (err, result) => {
            if(err) return res.status(500).send("Eroare server.");
            if(!result) return res.status(404).send("Lista copii nu se poate gasi.")
            res.status(200).send({children : result[0].children});
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
            'children.devices.token' : 1
        }, 
        (err, result) => {
            if(err) return res.status(500).send("Eroare server.");
            if(!result) return res.status(404).send("Lista cu device-uri nu se poate gasi.")

            res.status(200).send({devices: result[0].children[0].devices})
        }
    )
})

module.exports = router;


var jwt = require('jsonwebtoken'); // folosit ca sa creeze si sa verifice jwt
var config = require('../config');

// middlewhere
var verifyJWT = (req, res, next) => {
    var token = req.headers['x-access-token'];
    //verificam daca in parametrii primiti exista token
    if(!token) 
        return res.status(403).send({auth: false, message: 'No token provided'})
    
    //verificam daca este un token corect 
    jwt.verify(token, config.secret, (err, decoded) => {
        if(err) 
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'})
        req.id = decoded.id;
        next();
    })
}

module.exports = verifyJWT;
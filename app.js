var express = require('express');
var app = express();
var db = require('./db');


global.__root   = __dirname + '/'; 
app.get('/api', function(req, res){
    res.status(200).send('API works.')
})

var parentController = require(__root + 'controllers/parentController')
var childController = require(__root + 'controllers/childController')
app.use('/api/parent', parentController)
app.use('/api/child', childController)
module.exports = app;
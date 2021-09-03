var express = require('express');
var app = express();
var db = require('./db');


global.__root   = __dirname + '/'; 
app.get('/api', function(req, res){
    res.status(200).send('API works.')
})
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header("Access-Control-Allow-Headers", "x-access-token, Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var parentController = require(__root + 'controllers/parentController')
var childController = require(__root + 'controllers/childController')
//var notificationController = require(__root + 'controllers/notificationController')

app.use('/api/parent', parentController)
app.use('/api/child', childController)



module.exports = app;
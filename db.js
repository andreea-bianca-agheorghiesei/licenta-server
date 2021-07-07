var mongoose = require('mongoose');
var mongoDB = 'mongodb://127.0.0.1/licenta';
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongo connection error: '));

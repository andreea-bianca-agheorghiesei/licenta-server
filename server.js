var app = require('./app');
var port = process.env.PORT || 3000;

var jwt = require('jsonwebtoken'); // folosit ca sa creeze si sa verifice jwt
var config = require('./config');
var server = app.listen(port, () => {
    console.log('Express server listening on port ' + port);
});

var io = require('socket.io')(server);

io.use((socket, next)=> {
    if(socket.handshake.auth && socket.handshake.auth.jwt){
        try{          
            var decoded = jwt.verify(socket.handshake.auth.jwt, config.secret);
            socket.userId = decoded.id;
            console.log('decoded jwt: ' + decoded.id)
            next(); 
        }catch(err){
            next(new Error('Auth credentials are incorrect'));
        }          
    }
    else{
       next(new Error('Auth credentials are incorrect'));
    }
})

io.on('connection', socket => {
    // cream o camera pentru fiecare parinte 
    // ca sa nu mai retinem fiecare socket id 
    console.log('conexiune noua de la ' + socket.userId);
    socket.join(socket.userId) 
    socket.on('disconnect', () => { 
        socket.leave(socket.userId)
        console.log('clientul s-a deconectat');    
    });
})

app.set('socketio', io);
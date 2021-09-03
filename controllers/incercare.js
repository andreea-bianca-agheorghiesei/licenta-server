
function checkZoneIntersection(req) {
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
                            
                              
                        }
                })
            })
        })

}

/////////////////////////// create notification/////////////
 const io = req.app.get('socketio');
                            const rooms = getActiveRooms(io);
                            console.log(rooms)
                            getParentsIdSForChild(req.id)
                                .then((parents) => {
                                    parents.forEach((parent) => {
                                        // cream notificare in baza de date pentru toti parintii 
                                        var message = result[0].children[0].name + ' entered the zone: ' + zone.name;
                                        var notification = new Notification({
                                            userId : parent._id,
                                            title: 'Zone notification',
                                            message : message,
                                            read : false, 
                                            timestamp : Date()
                                        })
                                        notification.save()
                                            .then( notification => {
                                            console.log(notification._id)
                                            Tutore.findOneAndUpdate(
                                                {
                                                    'parents._id' : mongoose.Types.ObjectId(parent._id)
                                                },
                                                {
                                                    $push : {'parents.$.notifications':  notification._id }
                                                },(err, result) => {
                                                    if(err) console.log(err);
                                                    io.in(String(parent._id)).emit('notification', {notification : notification.toObject()});
                                                })                                           
                                            }) 
                                            if(rooms.includes(String(parent._id)))
                                            {
                                               //iar pentru toti parintii care sunt conectati prin socketuri primesc notificare 
                                               io.in(String(parent._id)).emit('notification', {notification : notification.toObject()});
                                            }
                                      })
                                    })
                                .catch(() => {})                      

/////////////////////////////  

function createNotifications(req, instersectedZones){
    checkZoneIntersection(req)
        .then((zones) => {
            zones.forEach(zone => {
                if( !instersectedZones.includes(zone))
                {
                    // daca zona curenta nu este una din zonele intersectate anterior atunci copilul a intrat intr-un perimetru
                    // fa notificare
                 //   Tutore.find

                }
                // alfel inseamna ca locatia anterioara a copilului se afla in aceasi zona ca in momentul prezent
                // adica copilul nu a parasit zona
            })
        }).catch(err => {

        })
}

const getParentsIdSForChild = async (deviceToken) => {
    try {
        var result = await Tutore.find(
        {
            'children.devices.token' : deviceToken
        },
        {
            'parents._id' : 1
        }
    )   
    return result[0].parents; 

    } catch (error) {
        return error;
    }
    
}

const checkZoneIntersection = async (req) => {
    console.log('sunt in check zone')
     getZones(req.id).then((zones) => {
       // console.log(zones)
        var intersected = []
        zones.forEach( zone => {
            isInZone(req.id, zone)
                .then( isInZone => {
                    console.log(isInZone)
                    if(isInZone) intersected.push(zone);
                }).catch(err => {
                    console.log(err);
                })
        })
        return intersected;
     }).catch (() => {

     });
}

const isInZone = async (deviceToken, zone) => {
    try{
    var result = await Tutore.find(
        {
            'children.devices.token' : deviceToken,
            'children.devices.location' : {
                '$geoWithin': {
                    '$centerSphere': [ zone.coordinates, zone.radius/(6378*1000)]
                    }
                }
        },
        {
            'children.devices.location.$' : 1,
            //'children.name' : 1
        });
    
        if(result) return true;
        return false;
    }catch(error){
        return error;
    }
}

const getZones = async (deviceToken) => {
    try{
    var result = await Tutore.find(
        {
            'children.devices.token': deviceToken
        },
        {
            'children.zones.$' : 1,
            '_id' : 0
        }
        
    )
        if(result) return result[0].children[0].zones;
        console.log(result)
    }catch(error) {
        return error;
    }
}


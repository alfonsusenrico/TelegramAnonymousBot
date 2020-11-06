//socket initialization
let server = require('http').createServer()
server.listen(7777,'ba3bd590df2c.ngrok.io');
let io = require('socket.io')(server)

//class room
class Room {
    constructor(user, roomId, location) {
        this.user1 = user
        this.user2 = undefined
        this.roomNum = roomId
        this.location = location
        this.matched = false
    }
    setRoom(user, location) {
        this.user1 = user
        this.location = location
    }
    addUser(user) {
        this.user2 = user
        this.matched = true
    }
    destroyRoom() {
        this.user1 = undefined
        this.user2 = undefined
        this.location = ""
        this.matched = false
    }
    getRoom() {
        return this.roomNum
    }
    getLocation() {
        return this.location
    }
    getMatch() {
        return this.matched
    }
    checkUser(id) {
        if(id == this.user1) {
            return this.user2
        }
        else {
            return this.user1
        }
    }
}

//initialize vars
var arrObject = []
var roomCount = 0

//socket on connection functions
io.on('connection', (socket) => {
    //vars
    var users = []

    //check connection
    console.log('socket connected')

    //basic functions
    async function pushId(data) {
        if(arrObject.length == 0) {
            arrObject.push(new Room(data.id, roomCount, data.location))
            roomCount++
            return roomCount-1
        }
        else {
            var get = false
            for(i = 0; i < arrObject.length; i++) {
                if(arrObject[i].user1 == undefined) {
                    arrObject[i].setRoom(data.id, data.location)
                    get = true
                    return i
                }
            }
            if (get == false) {
                arrObject.push(new Room(data.id, roomCount, data.location))
                roomCount++
                return roomCount-1
            }
        }
    }
    async function addId(data) {
        var exist = false
        for(i = 0;i < arrObject.length; i++) {
            if(arrObject[i].getMatch() == false) {
                if(String(data.location).toLowerCase() == String(arrObject[i].getLocation().toLowerCase())) {
                    arrObject[i].addUser(data.id)
                    await checkMatch()
                    exist = true
                    return i
                }
            }
            else {
                return pushId(data)
            }
        }
        if(exist == false) {
            return pushId(data)
        }
    }
    async function getRoom(data) {
        if(arrObject.length == 0) {
            return pushId(data)
        }
        else {
            return addId(data)
        }
    }
    async function checkMatch() {
        if(arrObject[socket.room].getMatch()) {
            io.sockets.in(socket.room).emit('matched', {user1: arrObject[socket.room].user1, user2: arrObject[socket.room].user2, msg: 'Sudah nemu nih...'})
            //clearInterval()
        }
    }
    // function interval(data) {
    //     setInterval(function() {
    //         checkMatch(data)
    //     }, 1000)
    // }

    //socket functions
    socket.on('start', (id) => {
        if(users.length > 0) {
            var exist = false
            for(i = 0; i < users.length; i++) {
                if(users[i].id == id) {
                    const data = {
                        'id' : id,
                        'location' : users[i].location
                    }
                    return io.emit('onStart', data)
                }
            }
            if(exist == false) {
                const data = {
                    'id' : id,
                    'location' : false
                }
                return io.emit('onStart', data)
            }
        }
        else {
            const data = {
                'id' : id,
                'location' : false
            }
            return io.emit('onStart', data)
        }
    })
    socket.on('getCondition', (id) => {
        if(arrObject.length == 0) {
            return io.emit('condition', false)
        }
        else {
            var exist = false
            for(i = 0; i < arrObject.length; i++) {
                if(arrObject[i].user1 == id || arrObject[i].user2 == id) {
                    return io.emit('condition', arrObject[i].getMatch())
                }
            }
            if(exist == false) {
                return io.emit('condition', false)
            }
        }
    })
    socket.on('check', (id) => {
        if(users.length == 0) {
            const data = {
                'id' : id,
                'location' : false
            }
            return io.emit('afterCheck', data)
        }
        else {
            var get = false
            for(i = 0; i<users.length; i++) {
                if(users[i].id == id) {
                    const data = {
                        'id' : id,
                        'location' : users[i].location
                    }
                    return io.emit('afterCheck', data)
                }
            }
            if(get == false) {
                const data = {
                    'id' : id,
                    'location' : false
                }
                return io.emit('afterCheck', data)
            }
        }
    })
    socket.on('location', (id) => {
        for(i = 0;i < users.length; i++) {
            if(users[i].id == id) {
                users[i].state = 'location'
                return
            }
        }
    })
    socket.on('changeLocation', (data) => {
        for(i = 0; i < users.length; i++) {
            if(users[i].id == data.id) {
                users[i].location = data.location
                users[i].state = 'default'
                for(i = 0; i < arrObject.length; i++) {
                    if(arrObject[i].user1 == data.id) {
                        arrObject[i].location = data.location
                        break
                    }
                }
                return io.emit('locationChanged', data)
            }
        }
    })
    socket.on('checkUser', (id) => {
        if(users.length == 0) {
            return io.emit('user', false)
        }
        else {
            var exist = false
            for(i = 0; i < users.length; i++) {
                if(users[i].id == id) {
                    exist = true
                    return io.emit('user', exist)
                }
            }
            if(exist == false) {
                return io.emit('user', exist)
            }
        }
    })
    socket.on('checkState', (id) => {
        if(users.length == 0) {
            return io.emit('state', 'unknown')
        }
        else {
            var exist = false
            for(i = 0;i < users.length; i++) {
                if(users[i].id == id) {
                    exist = true
                    return io.emit('state', users[i].state)
                }
            }
            if(exist == false) {
                return io.emit('state', 'unknown')
            }
        }
    })
    socket.on('insertData', (data) => {
        if(users.length == 0) {
            users.push(data)
            return io.emit('dataReady', {data: data})
        }
        else {
            var exist = false
            for(i = 0; i < users.length; i++) {
                if(users[i].id == data.id) {
                    exist = true
                    return
                }
            }
            if(exist == false) {
                users.push(data)
                return io.emit('dataReady', {data: data})
            }
        }
    })
    socket.on('getRoom', async (data) => {
        const room = await getRoom(data)
        socket.room = room
        socket.join(socket.room)
        socket.username = data.id
        var dat = {
            'id' : data.id,
            'room' : socket.room
        }
        io.emit('testing', dat)
        //searching = true
        //interval(data)
    })
    socket.on('destroy', (id) => {
        const id1 = id
        const id2 = arrObject[socket.room].checkUser(id1)
        io.sockets.in(socket.room).emit('destroyed', {user1: id1, user2: id2, msg: '/next telah digunakan..'})
        arrObject[socket.room].destroyRoom()
        socket.leave(socket.room)
    })
    socket.on('send-message', (data) => {
        if(data.msg != '/next') {
            io.sockets.in(socket.room).emit('sendMessage', {user: arrObject[socket.room].checkUser(data.id), msg: data.msg})
        }
    })
    socket.on('send-sticker', (data) => {
        io.sockets.in(socket.room).emit('sendSticker', {user: arrObject[socket.room].checkUser(data.id), sticker: data.sticker})
    })
    socket.on('send-animation', (data) => {
        io.sockets.in(socket.room).emit('sendAnimation', {user: arrObject[socket.room].checkUser(data.id), animation: data.animation})
    })
    socket.on('send-video', (data) => {
        io.sockets.in(socket.room).emit('sendVideo', {user: arrObject[socket.room].checkUser(data.id), video: data.video})
    })
    socket.on('send-audio', (data) => {
        io.sockets.in(socket.room).emit('sendAudio', {user: arrObject[socket.room].checkUser(data.id), audio: data.audio})
    })
    socket.on('send-voice', (data) => {
        io.sockets.in(socket.room).emit('sendVoice', {user: arrObject[socket.room].checkUser(data.id), voice: data.voice})
    })
    socket.on('send-photo', (data) => {
        io.sockets.in(socket.room).emit('sendPhoto', {user: arrObject[socket.room].checkUser(data.id), photo: data.photo})
    })
    //DEBUG TESTS
    socket.on('test', () => {
        console.log(arrObject)
        console.log(users)
        console.log(socket.room)
        console.log(socket.username)
        //console.log('searching: '+searching)
    })
})

//server listening port
server.listen(7777, function() {
    console.log('listening to port 7777')
})
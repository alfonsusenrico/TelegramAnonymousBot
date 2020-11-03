//socket initialization
let server = require('http').createServer()
server.listen(7777,'HOST');
let io = require('socket.io')(server)

//class room
class Room {
    constructor(user, roomId, location) {
        this.user1 = user
        this.user2 = undefined
        this.room = roomId
        this.location = location
        this.matched = false
    }
    addUser(user) {
        this.user2 = user
        this.matched = true
    }
    destroyRoom() {
        this.user1 = undefined
        this.user2 = undefined
        this.room = undefined
        this.location = undefined
        this.matched = false
        return this.room
    }
    getRoomId() {
        return this.room
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
var roomChats = []
var roomCount = 0
var searching = false

//socket
io.on('connection', (socket) => {
    //vars
    var users = []

    //functions
    function pushId(data) {
        console.log('pushId')
        arrObject[roomCount] = new Room(data.id, roomCount, data.location)
        roomChats.push(roomCount)
        roomCount++
        return roomCount-1
    }
    function addId(data) {
        console.log('addId')
        for(i = 0;i < roomChats.length; i++) {
            if(data.location == arrObject[roomChats[i]].getLocation()) {
                arrObject[roomChats[i]].addUser(data.id)
                checkMatch(data)
                return roomChats[i]
            }
            else {
                return pushId(data)
            }
        }
        
    }
    function getRoom(data) {
        console.log('getRoom')
        if(roomChats.length != 0) {
            // const freeRoom = arrObject[roomChats[roomCount-1]].getRoomId()
            // roomChats.pop
            return addId(data)
        }
        else {
            return pushId(data)
        }
    }
    function checkMatch(data) {
        if(searching) {
            console.log('checkMatch')
            if(arrObject[socket.room].getMatch()) {
                io.sockets.in(socket.room).emit('matched', {user: data.id, msg: 'Sudah nemu nih...'})
                searching = false
                clearInterval()
            }
        }
    }
    function interval(data) {
        setInterval(function() {
            checkMatch(data)
        }, 2000)
    }
    //check connection
    console.log('socket connected')

    //socket functions
    //DEBUG TESTS
    socket.on('test', () => {
        console.log(arrObject)
        console.log(roomChats)
        console.log(roomCount)
    })
    socket.on('getRoom', (data) => {
        if(users.length == 0) {
            var room = getRoom(data)
            socket.room = room
            socket.join(socket.room)
            users.push(data.id)
            searching = true
            interval(data)
        }   
        else if(users.length < 2) {
            if(data.id != users[0]) {
                var room = getRoom(data)
                socket.room = room
                socket.join(socket.room)
                users.push(data.id)
                searching = true
                interval(data)
            }
        }
        console.log(arrObject[room])
        console.log(users)
        console.log(roomChats)
    })
    socket.on('send-message', (data) => {
        if(data.msg != '/next') {
            io.sockets.in(socket.room).emit('sendMessage', {user: arrObject[socket.room].checkUser(data.id), msg: data.msg})
        }
    })
    socket.on('send-sticker', (data) => {
        if(data.msg != '/next') {
            io.sockets.in(socket.room).emit('sendSticker', {user: arrObject[socket.room].checkUser(data.id), sticker: data.sticker})
        }
    })
    socket.on('destroy', (id) => {
        const id1 = id
        const id2 = arrObject[socket.room].checkUser(id1)
        io.sockets.in(socket.room).emit('destroyed', {user1: id1, user2: id2, msg: 'Salah satu pihak ingin mengakhiri percakapan indah ini..'})
        arrObject[socket.room].destroyRoom()
        roomChats.pop()
        roomCount--
        socket.leave(socket.room)
        users = []
    })
})

//server listening port
server.listen(7777, function() {
    console.log('listening to port 7777')
})
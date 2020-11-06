//packages initialization
'use strict'
require('dotenv').config()
const telegram = require('node-telegram-bot-api')
const token = process.env.TELEGRAM_TOKEN
const bot = new telegram(token, { polling: true })

//socket client connection
const io = require("socket.io-client")
const socket = io("http://ba3bd590df2c.ngrok.io")

//var timeout
const timeout = 1000

//bot algorithm functions
socket.on('onStart', (data) => {
    if(data.location == false) {
        bot.sendMessage(data.id, `Halo, silahkan masukkan daerah asalmu dulu ya. `, { parse_mode: 'HTML' })
    }
    else {
        bot.sendMessage(data.id, `Halo, silahkan mulai dengan command /find`, { parse_mode: 'HTML' })
    }
})
socket.on('afterCheck', (data) => {
    if(data.location == false) {
        bot.sendMessage(data.id, `Lokasi anda tidak diketahui, silahkan gunakan command /start untuk set lokasi`, { parse_mode: 'HTML' })
    }
    else {
        setTimeout(() => {
            socket.emit('test')
            const task = socket.emit('getRoom',data)
            if(task.connected) {
                bot.sendMessage(data.id, `Mohon tunggu, mencari teman chat daerah ${data.location}`, { parse_mode: 'HTML' })
            }
            else {
                bot.sendMessage(data.id, `Mohon maaf sistem sedang offline, silahkan coba lagi nanti`, { parse_mode: 'HTML' })
            }
        }, timeout) 
    }
})
socket.on('dataReady', (data) => {
    bot.sendMessage(data.data.id, `Bot akan mencari teman di sekitar ${data.data.location}, silahkan mulai dengan command /find`, { parse_mode: 'HTML' })
})
socket.on('matched', (data) => {
    bot.sendMessage(data.user1, data.msg, { parse_mode: 'HTML' })
    bot.sendMessage(data.user2, data.msg, { parse_mode: 'HTML' })
    setTimeout(() => {
        bot.sendMessage(data.user1, `Silahkan memulai chat kalian :)`, { parse_mode: 'HTML' })
        bot.sendMessage(data.user2, `Silahkan memulai chat kalian :)`, { parse_mode: 'HTML' })
    }, timeout)
})
socket.on('locationChanged', (data) => {
    bot.sendMessage(data.id, `Bot akan mencari teman di sekitar ${data.location}, silahkan mulai dengan command /find`, { parse_mode: 'HTML' })
})
socket.on('destroyed', (data) => {
    bot.sendMessage(data.user1, data.msg, { parse_mode: 'HTML' })
    bot.sendMessage(data.user2, data.msg, { parse_mode: 'HTML' })
    setTimeout(() => {
        const message = `Silahkan mulai dengan command /find`
        bot.sendMessage(data.user1, message, { parse_mode: 'HTML' })
        bot.sendMessage(data.user2, message, { parse_mode: 'HTML' })
    }, timeout)
})

//socket handler
socket.on('sendMessage', (data) => {
    bot.sendMessage(data.user, data.msg, { parse_mode: 'HTML' })
})
socket.on('sendSticker', (data) => {
    bot.sendSticker(data.user, data.sticker)
})
socket.on('sendAnimation', (data) => {
    bot.sendAnimation(data.user, data.animation)
})
socket.on('sendVideo', (data) => {
    bot.sendVideo(data.user, data.video)
})
socket.on('sendVoice', (data) => {
    bot.sendVoice(data.user, data.voice)
})
socket.on('sendPhoto', (data) => {
    bot.sendPhoto(data.user, data.photo)
})
socket.on('sendAudio', (data) => {
    bot.sendAudio(data.user, data.audio)
})

//DEBUG SOCKET
socket.on('testing', (data) => {
    bot.sendMessage(data.id, `room number: ${data.room}`, { parse_mode: 'HTML' })
})

//additional function
async function getCondition(chatId) {
    socket.emit('getCondition', chatId)
    const inChat = await new Promise(resolve => {
        socket.on('condition',  data => {
            socket.removeEventListener('condition')
            resolve(data)
        })
    })
    return inChat
}
async function checkUser(chatId) {
    socket.emit('checkUser', chatId)
    const exist = await new Promise(resolve => {
        socket.on('user', data => {
            socket.removeEventListener('user')
            resolve(data)
        })
    })
    return exist
}
async function getState(chatId) {
    socket.emit('checkState', chatId)
    const state = await new Promise(resolve => {
        socket.on('state', data => {
            socket.removeEventListener('state')
            resolve(data)
        })
    })
    return state
}
//message handler
// bot.onText(/\/start/, async (msg) => {
//     const chatId = msg.chat.id
//     const inChat = await getCondition(chatId)
//     if(inChat == false) {
//         socket.emit('start', chatId)
//         if(msg.chat.title != undefined) {
//             bot.sendMessage(chatId, `Shallom seluruh anggota <b>${msg.chat.title}</b> Botnya belum bisa buat chat mode gangbang ya`, { parse_mode: 'HTML' })
//         }
//     }
// })
// bot.onText(/\/location/, async (msg) => {
//     const chatId = msg.chat.id
//     const inChat = await getCondition(chatId)
//     if(inChat == false) {
//         socket.emit('location', chatId)
//     }
// })
// bot.onText(/\/find/, async (msg) => {
//     const chatId = msg.chat.id
//     const inChat = await getCondition(chatId)
//         if(inChat == false) {
//             const username = msg.chat.username
//             if(username == undefined) {
//                 bot.sendMessage(chatId, `Mohon maaf ${msg.chat.first_name} silahkan membuat username dulu untuk menggunakan bot ini`)
//                 return
//             }
//             if(msg.chat.title == undefined) {
//                 socket.emit('check', chatId)
//             }
//             else {
//                 bot.sendMessage(chatId, `Mohon maaf chat masih belum bisa mode gangbang :)`, { parse_mode: 'HTML' })
//             }
//         }
// })
// bot.onText(/\/next/, async (msg) => {
//     const chatId = msg.chat.id
//     setTimeout(() => {
//         socket.emit('destroy', chatId)
//     }, timeout)
// })
bot.on('message', async (msg) => {
    //DEBUG COMMAND
    if(msg.text == '/test') {
        socket.emit('test')
        return
    }
    const chatId = msg.chat.id
    const inChat = await getCondition(chatId)
    if(inChat == false) {
        if(msg.text == '/start') {
            socket.emit('start', chatId)
            if(msg.chat.title != undefined) {
                bot.sendMessage(chatId, `Shallom seluruh anggota <b>${msg.chat.title}</b> Botnya belum bisa buat chat mode gangbang ya`, { parse_mode: 'HTML' })
            }
            return
        }
        else if(msg.text == '/find') {
            const username = msg.chat.username
            if(username == undefined) {
                bot.sendMessage(chatId, `Mohon maaf ${msg.chat.first_name} silahkan membuat username dulu untuk menggunakan bot ini`)
                return
            }
            if(msg.chat.title == undefined) {
                socket.emit('check', chatId)
            }
            else {
                bot.sendMessage(chatId, `Mohon maaf chat masih belum bisa mode gangbang :)`, { parse_mode: 'HTML' })
            }
        }
        else if(msg.text == '/location') {
            const userExist = await checkUser(chatId)
            if(userExist == true) {
                socket.emit('location', chatId)
                bot.sendMessage(chatId, `Silahkan masukkan lokasi baru`, { parse_mode: 'HTML' })
            }
            else {
                bot.sendMessage(chatId, `Halo, silahkan mulai dengan command /start dulu ya`, { parse_mode: 'HTML' })
            }
        }
        else {
            const userExist = await checkUser(chatId)
            if(userExist == false) {
                const location = msg.text.replace(/[^A-Za-z0-9]/g, '')
                const data = {
                    'id' : chatId,
                    'location' : location,
                    'state' : 'default'
                }
                socket.emit('insertData', data)
            }
            else {
                const state = await getState(chatId)
                if(state == 'location') {
                    var data = {
                        'id' : chatId,
                        'location' : msg.text.replace(/[^A-Za-z0-9]/g, '')
                    }
                    socket.emit('changeLocation', data)
                }
                else {
                    bot.sendMessage(chatId, `Silahkan gunakan command /find`, { parse_mode: 'HTML' })
                }
            } 
        }
    }
    else {
        if(msg.text == '/next') {
            setTimeout(() => {
                socket.emit('destroy', chatId)
            }, timeout)
        }
        else {
            const data = {
            'id' : chatId,
            'msg' : msg.text
            }
            socket.emit('send-message', data)
        }
    }
})
bot.on('animation', async(animation) => {
    const chatId = animation.chat.id
    const userExist = await checkUser(chatId)
    if(userExist == true) {
        const inChat = await getCondition(chatId)
        if(inChat == false) {
            bot.sendMessage(chatId, `Silahkan gunakan command /start atau /find`, { parse_mode: 'HTML' })
        }
        else {
            const data = {
                'id' : chatId,
                'animation' : animation.animation.file_id
            }
            socket.emit('send-animation', data)
        }
    }
    else {
        bot.sendMessage(chatId, `Halo, silahkan mulai dengan command /start`, { parse_mode: 'HTML' })
    }
})
bot.on('video', async(video) => {
    const chatId = video.chat.id
    const userExist = await checkUser(chatId)
    if(userExist == true) {
        const inChat = await getCondition(chatId)
        if(inChat == false) {
            bot.sendMessage(chatId, `Silahkan gunakan command /start atau /find`, { parse_mode: 'HTML' })
        }
        else {
            const data = {
                'id' : chatId,
                'video' : video.video.file_id
            }
            socket.emit('send-video', data)
        }
    }
    else {
        bot.sendMessage(chatId, `Halo, silahkan mulai dengan command /start`, { parse_mode: 'HTML' })
    }
})
bot.on('audio', async(audio) => {
    const chatId = audio.chat.id
    const userExist = await checkUser(chatId)
    if(userExist == true) {
        const inChat = await getCondition(chatId)
        if(inChat == false) {
            bot.sendMessage(chatId, `Silahkan gunakan command /start atau /find`, { parse_mode: 'HTML' })
        }
        else {
            const data = {
                'id' : chatId,
                'audio' : audio.audio.file_id
            }
            socket.emit('send-audio', data)
        }
    }
    else {
        bot.sendMessage(chatId, `Halo, silahkan mulai dengan command /start`, { parse_mode: 'HTML' })
    }
})
bot.on('photo', async(photo) => {
    const chatId = photo.chat.id
    const userExist = await checkUser(chatId)
    if(userExist == true) {
        const inChat = await getCondition(chatId)
        if(inChat == false) {
            bot.sendMessage(chatId, `Silahkan gunakan command /start atau /find`, { parse_mode: 'HTML' })
        }
        else {
            const data = {
                'id' : chatId,
                'photo' : photo.photo[2].file_id
            }
            socket.emit('send-photo', data)
        }
    }
    else {
        bot.sendMessage(chatId, `Halo, silahkan mulai dengan command /start`, { parse_mode: 'HTML' })
    }  
})
bot.on('voice', async(voice) => {
    const chatId = voice.chat.id
    const userExist = await checkUser(chatId)
    if(userExist == true) {
        const inChat = await getCondition(chatId)
        if(inChat == false) {
            bot.sendMessage(chatId, `Silahkan gunakan command /start atau /find`, { parse_mode: 'HTML' })
        }
        else {
            const data = {
                'id' : chatId,
                'voice' : voice.voice.file_id
            }
            socket.emit('send-voice', data)
        }
    }
    else {
        bot.sendMessage(chatId, `Halo, silahkan mulai dengan command /start`, { parse_mode: 'HTML' })
    } 
})
bot.on('sticker', async (sticker) => {
    const chatId = sticker.chat.id
    const userExist = await checkUser(chatId)
    if(userExist == true) {
        const inChat = await getCondition(chatId)
        if(inChat == false) {
            bot.sendMessage(chatId, `Silahkan gunakan command /start atau /find`, { parse_mode: 'HTML' })
        }
        else {
            const data = {
                'id' : chatId,
                'sticker' : sticker.sticker.file_id
            }
            socket.emit('send-sticker', data)
        }
    }
    else {
        bot.sendMessage(chatId, `Halo, silahkan mulai dengan command /start`, { parse_mode: 'HTML' })
    }
})

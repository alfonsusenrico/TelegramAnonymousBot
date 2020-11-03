//packages initialization
'use strict'
require('dotenv').config()
const express = require('express')
const app = express()
const telegram = require('node-telegram-bot-api')
const token = process.env.TELEGRAM_TOKEN
const bot = new telegram(token, { polling: true })
const emoji = '\u{00002714}'

//variable declaration
var toLocation = false
var inChat = false
var location = ""

//socket client connection
const io = require("socket.io-client")
const socket = io("HOST")

//telegram bot functions
socket.on('matched', (data) => {
    inChat = true
    bot.sendMessage(data.user, data.msg, { parse_mode: 'HTML' })
    setTimeout(() => {
        bot.sendMessage(data.user, `Silahkan memulai chat kalian :)`, { parse_mode: 'HTML' })
    }, 1000)
})
socket.on('sendMessage', (data) => {
    bot.sendMessage(data.user, data.msg, { parse_mode: 'HTML' })
})
socket.on('sendSticker', (data) => {
    bot.sendSticker(data.user, data.sticker)
})
socket.on('destroyed', (data) => {
    bot.sendMessage(data.user1, data.msg, { parse_mode: 'HTML' })
    bot.sendMessage(data.user2, data.msg, { parse_mode: 'HTML' })
    setTimeout(() => {
        const message = `Silahkan mulai dengan command /find`
        bot.sendMessage(data.user1, message, { parse_mode: 'HTML' })
        bot.sendMessage(data.user2, message, { parse_mode: 'HTML' })
        inChat = false
    }, 1000)

})
bot.onText(/\/start/, async (msg, match) => {
    if(!inChat) {
        const user = msg.from.first_name
        const chatId = msg.chat.id
        socket.emit('start', msg.id)
        if(msg.chat.title != undefined) {
            bot.sendMessage(chatId, `Shallom seluruh anggota <b>${msg.chat.title}</b> Botnya belum bisa buat chat mode gangbang ya`, { parse_mode: 'HTML' })
        }
        else {
            if(location != '' || location != undefined) {
                bot.sendMessage(chatId, `Halo <b>${user}</b>, silahkan masukkan daerah asalmu dulu ya`, { parse_mode: 'HTML' })
                toLocation = true
            }
            else {
                bot.sendMessage(chatId, `Halo <b>${user}</b>, silahkan mulai dengan command /find`, { parse_mode: 'HTML' })
            }
        }
    }
    else {
        return
    }
})
bot.onText(/\/find/, async (msg) => {
    if(!inChat) {
        const chatId = msg.chat.id
        const username = msg.chat.username
        if(username == undefined) {
            bot.sendMessage(chatId, `Mohon maaf ${msg.chat.first_name} silahkan membuat username dulu untuk menggunakan bot ini`)
            return
        }
        if(msg.chat.title == undefined) {
            if(location == "" || location == undefined) {
                bot.sendMessage(chatId, `Lokasi anda tidak diketahui, silahkan gunakan command /start untuk set lokasi`, { parse_mode: 'HTML' })
                return
            }
            const data = {
                'id' : chatId,
                'location' : location.toLowerCase()
            }
            setTimeout(() => {
                const task = socket.emit('getRoom',data)
                if(task.connected) {
                    bot.sendMessage(chatId, `Mohon tunggu, mencari teman chat daerah ${location}`, { parse_mode: 'HTML' })
                }
                else {
                    bot.sendMessage(chatId, `Mohon maaf sistem sedang offline, silahkan coba lagi nanti`, { parse_mode: 'HTML' })
                }
                toLocation = false;
            }, 1000) 
        }
        else {
            bot.sendMessage(chatId, `Mohon maaf chat masih belum bisa mode gangbang :)`, { parse_mode: 'HTML' })
            return
        }
    }
    else {
        return
    }
})
bot.onText(/\/next/, async (msg) => {
    const chatId = msg.chat.id
    setTimeout(() => {
        socket.emit('destroy', chatId)
    }, 1000)
    
})
bot.on('message', async (msg) => {
    const chatId = msg.chat.id
    if(!inChat) {
        if(msg.text != '/start') {
            if(msg.text != '/find') {
                if(toLocation === true) {
                    location = msg.text.replace(/[^A-Za-z0-9]/g, '')
                    bot.sendMessage(chatId, `Bot akan mencari teman di sekitar ${location}, silahkan mulai dengan command /find`, { parse_mode: 'HTML' })
                }
            }
        }
        else {
            return
        }
    }
    else {
        const data = {
            'id' : chatId,
            'msg' : msg.text
        }
        socket.emit('send-message', data)
    }
})
bot.on('sticker', async (sticker) => {
    const chatId = sticker.chat.id
    if(!inChat) {
        if(msg.text != '/start') {
            if(msg.text != '/find') {
                if(toLocation === true) {
                    location = msg.text.replace(/[^A-Za-z0-9]/g, '')
                    bot.sendMessage(chatId, `Bot akan mencari teman di sekitar ${location}, silahkan mulai dengan command /find`, { parse_mode: 'HTML' })
                }
            }
        }
        else {
            return
        }
    }
    else {
        const data = {
            'id' : chatId,
            'sticker' : sticker.sticker.file_id
        }
        socket.emit('send-sticker', data)
    }
})
//DEBUG TESTS
bot.onText(/\/test/, async (msg) => {
    const chatId = msg.chat.id
    socket.emit('test', '')
})

const db = require('../database')
const discord = require('discord.js')
const path = require('path')

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min
}

module.exports = {
    name: 'dice',
    description: 'Roll a dice',
    execute(message, args) {
        if(!args.length || args.length < 1) { args = ['6'] }
        var num = parseInt(args[0], 10)
        if (isNaN(num)) {
            message.channel.send('Please use a valid number')
            return
        }
        
        var result = getRandomInt(1, num)
        if (num == 6) {
            var img = new discord.Attachment(path.join(__dirname, '../img/dice/' + result + '.png'))
            message.channel.send(img)
        } else {
            message.channel.send('🎲 ' + result + ' 🎲')
        }
    },
}
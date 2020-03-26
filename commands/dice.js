const discord = require('discord.js')

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min
}

module.exports = {
    name: 'dice',
    description: 'Roll a simple dice',
    aliases: ['roll'],
    execute(message, args) {
        let max = 20
        const maxGuess = parseInt(args[0])
        if (!isNaN(maxGuess)) {
            max = maxGuess
        }

        const result = getRandomInt(1, max)
        message.channel.send(`🎲 ${result}`)
    }
}

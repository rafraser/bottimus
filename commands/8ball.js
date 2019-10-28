const discord = require('discord.js')
const path = require('path')

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min
}

module.exports = {
    name: '8ball',
    description: 'Ask the magic 8ball a question... if you dare',
    cooldown: 30,
    execute(message, args) {
        // Pick one of the 20 8ball images at random and send it as a reply
        var result = getRandomInt(1, 20)
        // var img = new discord.Attachment(path.join(__dirname, '../img/8ball/' + result + '.png'))
        var img = new discord.Attachment('./img/8ball/' + result + '.png')
        message.channel.send(img)
    },
}
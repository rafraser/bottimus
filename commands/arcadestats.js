const arcade = require('../arcade')
const discord = require('discord.js')

module.exports = {
    name: 'arcade',
    description: 'Get Arcade points information',
    execute(message, args, client) {
        arcade.getArcadeCredits(message.member.id).then(function(amount) {
            var coin = client.emojis.get('631834832300670976')
            message.channel.send(`Balance: ${amount}${coin}`)
        })
    },
}
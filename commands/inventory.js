const arcade = require('../arcade')
const pool = require('../database')
const discord = require('discord.js')

module.exports = {
    name: 'inventory',
    description: 'Display the prize inventory',
    execute(message, args, client) {
        arcade.getArcadePrizes(message.member.id).then(function(prizes) {
            var prizes2 = []
            for(var prize in prizes) {
                prizes2.push(prize + ':' + prizes[prize])
            }
            
            client.executePython('inventory', prizes2).then(function() {
                var attachment = new discord.Attachment('./img/inventory.png')
                message.channel.send(attachment)
            })
        })
    },
}
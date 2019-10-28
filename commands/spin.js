const arcade = require('../arcade')
const pool = require('../database')
const discord = require('discord.js')

module.exports = {
    name: 'spintest',
    description: 'Spin the test wheel',
    cooldown: 30,
    execute(message, args, client) {
        if(client.spinningWheel) return
        
        client.spinningWheel = true
        
        message.channel.send('Building the wheel...').then(function(m) {
            client.executePython('spinner', args).then(function(data) {
                var attachment = new discord.Attachment('./img/spinner.gif')
                message.channel.send(attachment).then(function() {
                    setTimeout(function() { 
                        message.channel.send(data)
                        client.spinningWheel = null
                    }, 4000)
                }).catch(function() {
                    message.channel.send('The wheel broke :(')
                    client.spinningWheel = null
                })
            })
        })
    },
}
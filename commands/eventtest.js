const discord = require('discord.js')
const events = require('../events')

module.exports = {
    name: 'eventtest',
    description: 'Testing commands for events',
    execute(message, args, client) {
        if(message.guild.id != '309951255575265280') return
        
        if(!client.isAdministrator(message.member)) {
            message.channel.send('You need to be an Administrator to use this!')
            return
        }

        // Create the locally stored events storage if it doesn't exist
        if(client.eventsData == null) {
            client.eventsData = new discord.Collection()
        }

        // Generate an initial event embed
        var event = events.generateEvent(message.member, args[0], args[1], new Date(Date.now() + 1000*15))
        var timeLeft = client.timeToString(event.time - Date.now())
        var embed = events.generateEventEmbed(event, timeLeft)

        message.channel.send(embed).then(function(msg) {
            msg.react('🔔')
            client.eventsData.set(message.channel.id + ',' + msg.id, event)
        })
    },
}
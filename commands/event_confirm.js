const discord = require('discord.js')
const events = require('../events')

// Channel where approved events should be displayed
const eventChannel = '621422264251973664'

function approveEvent(event, channel, client) {
    if(client.eventsData == null) {
        client.eventsData = new discord.Collection()
    }

    // Generate an initial event embed
    var timeLeft = client.timeToString(event.time - Date.now())
    var embed = events.generateEventEmbed(event, timeLeft)

    channel.send(embed).then(function(msg) {
        msg.react('🔔')
        client.eventsData.set(channel.id + ',' + msg.id, event)

        // Write a data file in case of restarting
        client.writeDataFile('events', channel.id + ',' + msg.id, event)
    })
}

module.exports = {
    name: 'confirmevent',
    description: 'Confirm a scheduled event',
    aliases: ['requestedevents', 'eventqueue'],
    execute(message, args, client) {
        if(message.guild.id != '309951255575265280') return
        
        // Restrict this command to administrators
        if(!client.isAdministrator(message.member)) {
            message.channel.send('You need to be an Administrator to use this!')
            return
        }

        // Create the locally stored events storage if it doesn't exist
        if(client.requestedEventsData == null || client.requestedEventsData.length < 1) {
            message.channel.send('No events are currently requested')
            return
        }

        // Display the oldest scheduled event
        var event = client.requestedEventsData[0]
        var timeLeft = client.timeToString(event.time - Date.now())
        var embed = events.generateEventEmbed(event, timeLeft)

        // Send the message and await administrator action
        message.channel.send(embed).then(function(msg) {
            // Make sure the reactions are in the right order
            // Subtle but annoying if not implemented
            msg.react('✅').then(function() {
                msg.react('❎')
            })

            const filter = function(reaction, user) {
                return user.id == message.member.id && (reaction.emoji.name == '✅' || reaction.emoji.name == '❎')
            }
            
            var collector = msg.createReactionCollector(filter, {time: 15000})
            collector.on('collect', function(r) {
                // Approve or deny the event
                if(r.emoji.name == '✅') {
                    approveEvent(event, message.channel, client)
                    msg.delete()
                    msg.channel.send('Event approved!')
                } else if(r.emoji.name == '❎') {
                    msg.delete()
                    msg.channel.send('Event denied!')
                }

                client.requestedEventsData.shift()
                collector.stop()
            })
        })
    }
}
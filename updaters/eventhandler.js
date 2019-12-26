const discord = require('discord.js')
const events = require('../events')

const output = '309951255575265280'

module.exports = {
    description: 'Handles updating event details',
    frequency: 1,
    execute(client) {
        client.eventsData.forEach(function(event, location) {
            // Get the message from the given location
            var locationSplit = location.split(',')
            var channel = client.channels.get(locationSplit[0])

            channel.fetchMessage(locationSplit[1]).then(function(message) {
                // Update the message
                if(Date.now() > event.time) {
                    // Get a list of messages who hit the bell reaction
                    var users = message.reactions.get('🔔').users
                    var pingString = ''
                    for(var user of users.values()) {
                        if(user.bot) continue
                        pingString += user.toString() + ' '
                    }

                    // Send the starting message notification
                    var outChannel = client.channels.get(output)
                    outChannel.send(`Event **${event.title}** is now starting!\n${pingString}`)

                    message.delete()
                    client.eventsData.delete(location)
                } else {
                    // Update the time remaining
                    var timeLeft = client.timeToString(event.time - Date.now())
                    var embed = events.generateEventEmbed(event, timeLeft)
                    message.edit(embed)
                }
            })
        })
        
    }
}
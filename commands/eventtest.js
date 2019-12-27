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

        try {
            var title = args.shift()
            var description = args.shift()
            
            var now = new Date(Date.now())
            var datetime = {
                year: now.getFullYear(),
                month: now.getMonth(),
                day: now.getDate()
            }

            while(args.length >= 1) {
                var arg = args.shift()
                if(arg.includes(':')) {
                    // Try parsing this argument as time
                    arg = arg.split(':')
                    datetime.hour = arg[0]
                    datetime.minute = arg[1]
                } else if(arg.includes('-')) {
                    // Try parsing this argument as YYYY-MM-DD
                    arg = arg.split('-')
                    datetime.year = arg[0]
                    datetime.month = arg[1]
                    datetime.day = arg[2]
                } else if(arg.includes('/')) {
                    // Try parsing this argument as DD/MM/YYYY
                    arg = arg.split('/')
                    datetime.day = arg[0]
                    datetime.month = arg[1]
                    datetime.year = arg[2]
                }
            }

            console.log(title, description, datetime)
            
            var when = new Date(datetime.year, datetime.month, datetime.day, datetime.hour, datetime.minute)
            console.log(when)
        } catch(e) {
            console.error(e)
            message.channel.send('Invalid event structure')
        }

        // Generate an initial event embed
        var event = events.generateEvent(message.member, title, description, when)
        var timeLeft = client.timeToString(event.time - Date.now())
        var embed = events.generateEventEmbed(event, timeLeft)

        message.channel.send(embed).then(function(msg) {
            msg.react('🔔')
            client.eventsData.set(message.channel.id + ',' + msg.id, event)
        })
    },
}
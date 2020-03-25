const discord = require('discord.js')
const events = require('../util/events')
const updater = require('../handlers/updaters/eventhandler')

function approveEvent(event, client) {
  if (client.eventsData == null) {
    client.eventsData = new discord.Collection()
  }

  const snowflake = discord.SnowflakeUtil.generate()
  client.eventsData.set(snowflake, event)
  client.writeDataFile('events', snowflake, event)

  // Update the next upcoming event (if applicable)
  client.upcomingEvent = events.getNextEvent(client)
  if (client.upcomingEvent.title === event.title && client.upcomingEvent.description === event.description) {
    updater.execute(client, true)
  }
}

module.exports = {
  name: 'confirmevent',
  description: 'Confirm a scheduled event',
  aliases: ['requestedevents', 'eventqueue'],
  guilds: ['309951255575265280'],
  execute(message, args, client) {
    // Restrict this command to administrators
    if (!client.isAdministrator(message.member)) {
      message.channel.send('You need to be an Administrator to use this!')
      return
    }

    // Create the locally stored events storage if it doesn't exist
    if (client.requestedEventsData == null || client.requestedEventsData.length < 1) {
      message.channel.send('No events are currently requested')
      return
    }

    // Display the oldest scheduled event
    const event = client.requestedEventsData[0]
    const timeLeft = client.timeToString(event.time - Date.now(), 2)
    const embed = events.generateEventEmbed(event, timeLeft)

    // Send the message and await administrator action
    message.channel.send(embed).then(function (msg) {
      // Make sure the reactions are in the right order
      // Subtle but annoying if not implemented
      msg.react('✅').then(function () {
        msg.react('❎')
      })

      const filter = function (reaction, user) {
        return user.id === message.member.id && (reaction.emoji.name === '✅' || reaction.emoji.name === '❎')
      }

      const collector = msg.createReactionCollector(filter, { time: 15000 })
      collector.on('collect', function (r) {
        // Approve or deny the event
        if (r.emoji.name === '✅') {
          approveEvent(event, client)
          msg.channel.send('Event approved!')
        } else if (r.emoji.name === '❎') {
          msg.channel.send('Event denied!')
        }

        client.requestedEventsData.shift()
        collector.stop()
      })
    })
  }
}

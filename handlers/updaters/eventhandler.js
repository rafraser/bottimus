const eventlib = require('../../util/events')

const notificationChannel = '309951255575265280'
const displayChannel = '621422264251973664'

function updateEventMessage(client, eventChannel, event) {
  eventChannel.messages.fetch({ limit: 10 }).then(messages => {
    const displayMessage = messages.find(m => m.author.bot)
    if (!displayMessage) {
      console.error('No message found? Hmm...')
    }

    // If the display message already has an embed, make sure it's for this event
    // If not, send a new message and repeat this process
    if (displayMessage.embeds && displayMessage.embeds.length >= 1) {
      const embed = displayMessage.embeds[0]
      const trimmedTitle = event.title.trim()
      if (embed.title != trimmedTitle) {
        updateEvent(client, true)
        return
      }
    }

    if (Date.now() > event.time) {
      // Send the event notification out
      const reaction = displayMessage.reactions.cache.get('🔔')
      if (reaction) {
        reaction.users.fetch().then(users => {
          const pingString = users.filter(user => !user.bot).map(user => user.toString()).join(' ')
          const channel = client.channelWithTesting(notificationChannel)
          channel.send(`Event **${event.title}** is now starting!\n${pingString}`)

          const amount = users.filter(user => !user.bot).size
          eventlib.addEventHistory(event, amount)
        })
      }

      // Cleanup the event
      event.complete = true
      displayMessage.edit(eventlib.generateCompletedEventEmbed(event))

      client.upcomingEvent = eventlib.getNextEvent(client)
      updateEvent(client, true)
    } else {
      const timeLeft = client.timeToString(event.time - Date.now(), 2)
      const embed = eventlib.generateEventEmbed(event, timeLeft)
      displayMessage.edit('', embed)

      // Add a bell icon if one doesn't exist
      if (!displayMessage.reactions.cache.get('🔔')) {
        displayMessage.react('🔔')
      }
    }
  }).catch(console.error)
}

function updateEvent(client, guild, events, sendNew = false, ignoreTime = false) {
  // Find the event display message
  const eventChannel = client.channelWithTesting(displayChannel)
  let upcomingEvent = eventlib.getNextEvent(client, guild)
  if (!upcomingEvent) return

  // Don't display events that are further than 24 hours away
  if (Date.now() + (24 * 3600 * 1000) < upcomingEvent.time && !ignoreTime) {
    return
  }

  // Send a new message for the next event (if applicable)
  if (sendNew) {
    eventChannel.send('[Next Event]').then(() => updateEventMessage(client, eventChannel, upcomingEvent))
  } else {
    updateEventMessage(client, eventChannel, upcomingEvent)
  }
}

function updateEvents(client, sendNew = false, ignoreTime = false) {
  if (!client.eventsData) return

  for (const entry of client.eventsData.entries()) {
    const guild = entry[0]
    const events = entry[1]

    updateEvent(client, guild, events, sendNew, ignoreTime)
  }
}

module.exports = {
  description: 'Handles updating event details',
  frequency: 3,
  execute: updateEvents
}

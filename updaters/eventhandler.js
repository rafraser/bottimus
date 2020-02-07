const events = require('../events')

const notificationChannel = '309951255575265280'
const displayChannel = '621422264251973664'
const historicalChannel = '672037357242810378'

function updateEvent(client, sendNew = false) {
  if (!client.eventsData) return

  if (!client.upcomingEvent) {
    client.upcomingEvent = events.getNextEvent(client)
  }

  // Find the event display message
  const eventChannel = client.channelWithTesting(displayChannel)
  const event = client.upcomingEvent

  // Send a new message for the next event (if applicable)
  if (sendNew) {
    eventChannel.send('[Next Event]')
  }

  eventChannel.fetchMessages({ limit: 10 }).then(messages => {
    const displayMessage = messages.find(m => m.author.bot)

    if (Date.now() > event.time) {
      // Send the event notification out
      const reaction = displayMessage.reactions.get('🔔')
      if (reaction) {
        reaction.fetchUsers().then(users => {
          const pingString = users.filter(user => !user.bot).map(user => user.toString()).join(' ')
          const channel = client.channelWithTesting(notificationChannel)
          channel.send(`Event **${event.title}** is now starting!\n${pingString}`)
        })
      }

      // Cleanup the event
      event.complete = true
      displayMessage.edit(events.generateCompletedEventEmbed(event))

      client.upcomingEvent = events.getNextEvent(client)
      updateEvent(client, true)
    } else {
      const timeLeft = client.timeToString(event.time - Date.now(), 2)
      const embed = events.generateEventEmbed(event, timeLeft)
      displayMessage.edit(embed)

      // Add a bell icon if one doesn't exist
      if (!displayMessage.reactions.get('🔔')) {
        displayMessage.react('🔔')
      }
    }
  }).catch(console.error)
}

module.exports = {
  description: 'Handles updating event details',
  frequency: 3,
  execute: updateEvent
}

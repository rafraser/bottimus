const events = require('../events')

const notificationChannel = '309951255575265280'
const displayChannel = '621422264251973664'
const historicalChannel = '672037357242810378'

function updateEvent(client) {
  if (!client.eventsData) return

  if (!client.upcomingEvent) {
    client.upcomingEvent = events.getNextEvent(client)
  }

  // Find the event display message
  const eventChannel = client.channelWithTesting(displayChannel)
  const event = client.upcomingEvent

  eventChannel.fetchMessages({ limit: 10 }).then(messages => {
    const displayMessage = messages.find(m => m.author.bot)

    if (Date.now() > event.time) {
      // Start the event!
      const reaction = displayMessage.reactions.get('🔔')
      const users = reaction ? reaction.users : []
      const pingString = users.filter(user => !user.bot).map(user => user.toString()).join(' ')
      const channel = client.channelWithTesting(notificationChannel)

      channel.send(`Event **${event.title}** is now starting!\n${pingString}`)

      // Cleanup the event
      event.complete = true
      client.channels.get(historicalChannel).send(events.generateCompletedEventEmbed(event))
      client.upcomingEvent = events.getNextEvent(client)
      updateEvent(client)
    } else {
      const timeLeft = client.timeToString(event.time - Date.now(), 2)
      const embed = events.generateEventEmbed(event, timeLeft)
      displayMessage.edit(embed)
    }
  }).catch(console.error)
}

module.exports = {
  description: 'Handles updating event details',
  frequency: 3,
  execute: updateEvent
}

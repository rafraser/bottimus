const events = require('../util/events')

module.exports = {
  name: 'eventlist',
  description: 'Get a brief list of what events are upcoming',
  aliases: ['events'],
  guilds: ['309951255575265280'],
  cooldown: 10,
  execute(message, args, client) {
    if (!client.eventsData || client.eventsData.size < 1) {
      message.channel.send('No events are currently scheduled!')
      return
    }

    // Sort the events by whichever is soonest
    const sortedEvents = client.eventsData.sort((a, b) => {
      return a.time - b.time
    }).array()

    // Get timezone from arguments
    let timezone = 'AEST'
    if (args.length >= 1) {
      timezone = args[0]
    }

    // Generate a code block list
    let outputString = '```cs\n# Upcoming Events #'
    let now = Date.now()
    sortedEvents.forEach((item, index) => {
      if (Date.now() > item.time) return

      let name = item.title.replace("'", "")
      let timeString = events.formatEventDate(item.time, false, timezone)

      outputString += '\n' + client.padOrTrim(name, 20) + '  ' + client.padOrTrim(timeString, 25)
    })
    outputString += '```'
    message.channel.send(outputString)
  }
}

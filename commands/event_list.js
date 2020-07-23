const eventlib = require('../util/events')

module.exports = {
  name: 'eventlist',
  description: 'Get a brief list of what events are upcoming',
  aliases: ['events'],
  guilds: ['309951255575265280'],
  cooldown: 10,
  execute(message, args, client) {
    const events = eventlib.getSortedEvents(client, message.guild.id)
    if (!events || events.size < 1) {
      message.channel.send('No events are currently scheduled!')
      return
    }

    // Get timezone from arguments
    let timezone = 'AEST'
    if (args.length >= 1) {
      timezone = args[0]
    }

    // Generate a code block list
    let outputString = '```cs\n# Upcoming Events #'
    events.forEach((item, index) => {
      let event = item[1]
      if (Date.now() > event.time) return

      let name = event.title.replace("'", "")
      let timeString = eventlib.formatEventDate(event.time, false, timezone)

      outputString += '\n' + client.padOrTrim(name, 20) + '  ' + client.padOrTrim(timeString, 25)
    })
    outputString += '```'
    message.channel.send(outputString)
  }
}

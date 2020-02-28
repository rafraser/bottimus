const discord = require('discord.js')

module.exports = {
  name: 'calendar',
  description: 'Display the current event calendar',
  guilds: ['309951255575265280'],
  cooldown: 30,
  execute(message, args, client) {
    if (!client.eventsData || client.eventsData.size < 1) {
      message.channel.send('No events are currently scheduled!')
      return
    }

    const events2 = []
    for (const event of client.eventsData.values()) {
      events2.push(`${event.time.toUTCString()}|${event.category}|${event.title}`)
    }

    client.executePython('calendar_display', events2).then(function () {
      const attachment = new discord.Attachment('./img/calendar.png')
      message.channel.send(attachment)
    })
  }
}

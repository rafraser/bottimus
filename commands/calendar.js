const discord = require('discord.js')

module.exports = {
  name: 'calendar',
  description: 'Display the current event calendar',
  cooldown: 30,
  execute(message, args, client) {
    if (!client.eventsData || client.eventsData.size < 1) {
      message.channel.send('No events are currently scheduled!')
      return
    }

    var events2 = []
    for (var event of client.eventsData.values()) {
      events2.push(`${event.time.toUTCString()}|${event.category}|${event.title}`)
    }

    client.executePython('calendar_display', events2).then(function () {
      var attachment = new discord.Attachment('./img/calendar.png')
      message.channel.send(attachment)
    })
  }
}

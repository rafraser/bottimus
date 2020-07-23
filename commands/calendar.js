const discord = require('discord.js')
const events = require('../util/events')

module.exports = {
  name: 'calendar',
  description: 'Display the current event calendar',
  guilds: events.approvedGuilds,
  cooldown: 20,
  execute(message, args, client) {
    events.generateCalendar(client, message.guild.id).then(filename => {
      const attachment = new discord.MessageAttachment(filename)
      message.channel.send(attachment)
    }).catch(e => {
      message.channel.send(e.message)
    })
  }
}

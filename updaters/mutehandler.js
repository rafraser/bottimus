const discord = require('discord.js')
const mute = require('../commands/mute.js')

module.exports = {
  description: 'Handles unmuting after a given amount of time',
  frequency: 1,
  execute (client) {
    if (!client.mutesData) return

    client.mutesData.forEach(function (data, id) {
      // Unmute each user if sufficient time has passed
      if (Date.now() > data.unmute.getTime()) {
        mute.unmute(client, id)
      }
    })
  }
}

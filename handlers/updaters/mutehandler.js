const mute = require('../../commands/mute.js')

module.exports = {
  description: 'Handles unmuting after a given amount of time',
  frequency: 1,
  execute(client) {
    if (!client.mutesData) return

    client.mutesData.forEach((data, id) => {
      // Unmute each user if sufficient time has passed
      if (Date.now() > data.unmute.getTime()) {
        mute.unmute(client, id)
      }
    })
  }
}

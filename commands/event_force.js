const updater = require('../handlers/updaters/eventhandler')

module.exports = {
  name: 'forceevent',
  description: 'Force an event to be displayed',
  guilds: ['309951255575265280'],
  execute(message, args, client) {
    // Restrict this command to administrators
    if (!client.isAdministrator(message.member)) {
      message.channel.send('You need to be an Administrator to use this!')
      return
    }

    updater.execute(client, true, true)
  }
}

const updater = require('../updaters/eventhandler')

module.exports = {
  name: 'forceevent',
  description: 'Force an event to be displayed',
  execute(message, args, client) {
    if (message.guild.id !== '309951255575265280') return

    // Restrict this command to administrators
    if (!client.isAdministrator(message.member)) {
      message.channel.send('You need to be an Administrator to use this!')
      return
    }
    
    updater.execute(client, true)
  }
}
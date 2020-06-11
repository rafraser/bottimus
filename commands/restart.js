module.exports = {
  name: 'restart',
  description: '🛡️ Restarts Bottimus',
  aliases: ['die', 'suicide'],
  guilds: ['309951255575265280'],
  execute(message, args, client) {
    if (!client.isAdministrator(message.member)) {
      message.channel.send('You need to be an Administrator to use this!')
      return
    }

    // Restart the bot after a brief delay
    message.channel.send('Goodbye!')

    // Put a notification in the bot's status to alert the state
    client.user.setPresence({
      activity: { name: 'Restarting!' },
      status: 'idle'
    })

    // Give the bot about 30 seconds, but put the bot into a 'shutdown' mode first
    client.restartingSoon = true
    setTimeout(function () {
      process.exit(1)
    }, 30 * 1000)
  }
}

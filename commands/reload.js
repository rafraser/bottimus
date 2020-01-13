module.exports = {
  name: 'restart',
  description: '🛡️ Restarts Bottimus',
  aliases: ['die', 'reload', 'suicide'],
  execute (message, args, client) {
    if (!client.isAdministrator(message.member)) {
      message.channel.send('You need to be an Administrator to use this!')
      return
    }

    // Restart the bot after a brief delay
    message.channel.send('Goodbye!')
    setTimeout(function () {
      process.exit(1)
    }, 1000)
  }
}

module.exports = {
  name: 'say',
  description: '🛡️ Secret admin command',
  guilds: ['309951255575265280'],
  execute(message, args, client) {
    var user = message.member
    if (client.isAdministrator(user)) {
      var string = args.join(' ')
      message.delete()
      message.channel.send(string)
    }
  }
}

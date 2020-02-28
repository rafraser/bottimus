module.exports = {
  name: 'say',
  description: '🛡️ Secret admin command',
  guilds: ['309951255575265280'],
  execute(message, args, client) {
    const user = message.member
    if (client.isAdministrator(user)) {
      message.delete()
      message.channel.send(args.join(' '))
    }
  }
}

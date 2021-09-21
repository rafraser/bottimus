import { Client, Message } from '../command'

export default {
  name: 'restart',
  description: '🛡️ Restarts Bottimus',
  aliases: ['die', 'suicide'],
  guilds: ['786168512795901962'],

  async execute (client: Client, message: Message, args: string[]) {
    if (!client.isAdministrator(message.member)) {
      message.channel.send('You need to be an Administrator to use this!')
      return
    }

    // Restart the bot after a brief delay
    message.channel.send('Goodbye!')

    // Give the bot about 30 seconds, but put the bot into a 'shutdown' mode first
    client.restarting = true
    setTimeout(_ => process.exit(1), 20 * 1000)
  }
}

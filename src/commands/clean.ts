import { Client, Message } from '../command'

export default {
  name: 'clean',
  description: '🛡️ Delete the last X messages from the channel',
  aliases: ['cleanup'],
  guilds: ['309951255575265280'],

  async execute (client: Client, message: Message, args: string[]) {
    if (!client.isAdministrator(message.member)) {
      message.channel.send('You need to be an Administrator to use this!')
      return
    }

    let num = args.shift() || 50
    num = Math.min(parseInt(num as string, 10) + 1, 100)
    if (isNaN(num)) {
      return -1
    }

    // Bulk delete has a limit of 100
    message.channel.bulkDelete(num)
  }
}

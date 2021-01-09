import { Client, Message } from '../command'

export default {
  name: 'say',
  description: '🛡️ Secret admin command',
  guilds: ['786168512795901962'],

  async execute (client: Client, message: Message, args: string[]) {
    if (client.isAdministrator(message.member)) {
      message.delete()
      message.channel.send(args.join(' '))
    }
  }
}

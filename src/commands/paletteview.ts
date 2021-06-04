import { Message, MessageAttachment } from 'discord.js'
import { Client } from '../command'

export default {
  name: 'paletteview',
  description: 'Beta!',
  cooldown: 60,

  async execute (client: Client, message: Message, args: string[]) {
    if (args.length === 1) {
      try {
        const result = await client.executePython('paletteview', [args[0]])
        message.channel.send(new MessageAttachment(result))
      } catch (error) {
        await message.channel.send(`Something went wrong: ${error}`)
      }
    } else {
      message.channel.send('Please tell me a palette! eg. `!paletteview flatui`')
    }
  }
}

import { Client, Message } from '../command'
import { getArcadePrizes } from '../arcade'
import { MessageAttachment } from 'discord.js'

export default {
  name: 'inventory',
  description: 'Display all the prizes collected so far. Can you get all 30?\nTo view someone else\'s inventory: `!inventory [user]`',
  aliases: ['inv'],
  cooldown: 15,

  async execute (client: Client, message: Message, args: string[]) {
    try {
      const user = await client.findUser(message, args, true)
      const prizes = await getArcadePrizes(user.id)

      const pythonArgs = ['--prizes']
      for (const prize in prizes) {
        pythonArgs.push(prize + ':' + prizes[prize])
      }

      await client.executePython('inventory', pythonArgs)
      const attachment = new MessageAttachment('./img/inventory.png')
      message.channel.send({ files: [attachment] })

      client.updateCooldown(this, message.member.id)
    } catch (e) {
      message.channel.send(e.message)
    }
  }
}

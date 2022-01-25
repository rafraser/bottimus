import { Client, Message } from '../command'
import { getArcadePrizes } from '../arcade'
import { MessageAttachment } from 'discord.js'

export default {
  name: 'inventory',
  description: 'Display all the prizes collected so far. Can you get all 30?\nTo view someone else\'s inventory: `!inventory [user]`',
  aliases: ['inv'],
  cooldown: 15,

  async execute (client: Client, message: Message, args: string[]) {
    const user = await client.findUser(message, args, true)
    const prizes = await getArcadePrizes(user.id)

    // Guard for empty inventories
    if (prizes.length < 1) {
      message.channel.send(`${user.displayName} has collected no prizes!`)
      return
    }

    // Generate an inventory image and send it
    const pythonArgs = ['--prizes']
    for (const prize in prizes) {
      pythonArgs.push(prize + ':' + prizes[prize])
    }

    await client.executePython('inventory', pythonArgs)
    const attachment = new MessageAttachment('./img/inventory.png')
    message.channel.send({ files: [attachment] })

    client.updateCooldown(this, message.member.id)
  }
}

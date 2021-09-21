import { Client, Message } from '../command'
import { MessageAttachment } from 'discord.js'

function getRandomInt (min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min
}

export default {
  name: '8ball',
  description: 'Ask the magic 8ball a question... if you dare',
  cooldown: 15,

  async execute (client: Client, message: Message, args: string[]) {
    // Pick one of the 20 8ball images at random and send it as a reply
    const result = getRandomInt(1, 20)
    const attachment = new MessageAttachment('./img/8ball/' + result + '.png')
    message.channel.send({ files: [attachment] })

    client.updateCooldown(this, message.member.id)
  }
}

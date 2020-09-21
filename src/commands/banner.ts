import { Client, Message } from '../command'
import { Guild } from 'discord.js'

const BANNERS = [
  'brr', 'cabin', 'canada', 'citizen', 'fox', 'kablam', 'orange', 'pain', 'simple', 'vibing'
]

export function chooseRandomBanner (guild: Guild) {
  const banner = BANNERS[Math.floor(Math.random() * BANNERS.length)]
  const file = `./img/banner/${banner}.png`
  guild.setBanner(file)
}

export default {
  name: 'banner',
  description: '🛡️ Set the server banner',
  guilds: ['309951255575265280'],

  async execute (client: Client, message: Message, args: string[]) {
    if (client.isAdministrator(message.member)) {
      const file = args.shift()
      if (file) {
        message.guild.setBanner('./img/banner/' + file)
      } else {
        chooseRandomBanner(message.guild)
      }
    }
  }
}

import { Client, Message } from '../command'
import { MessageEmbed } from 'discord.js'
import fetch from 'node-fetch'

export default {
  name: 'stats',
  description: 'Fetchs statistics from Simply Murder',
  aliases: ['murderstats'],
  guilds: ['309951255575265280'],

  async execute (client: Client, message: Message, args: string[]) {
    if (!args.length || args.length < 1) { return }

    // Friendly join multiple arguments
    if (args.length > 1) {
      args[0] = args.join(' ')
    }

    const resp = await fetch('https://fluffyservers.com/api/stats/search/' + args[0])
    const data = await resp.json()
    try {
      const result = data.results[0]
      const embed = new MessageEmbed()
        .setColor('#e84118')
        .setTitle(`Stats for ${result.username}`)
        .addField('Hours Played', `${Math.floor(result.playtime / 3600) || 0}`, false)
        .addField('Stats Profile', `http://fluffyservers.com/profile.html?steamid=${result.steamid64}`, false)
      message.channel.send(embed)
    } catch (e) {
      message.channel.send('User not found in database')
    }
  }
}

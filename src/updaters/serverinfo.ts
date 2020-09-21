import gamedig from 'gamedig'
import { Message, TextChannel, MessageEmbed } from 'discord.js'
import { Client } from '../updater'
import { getEventTable } from '../commands/event_list'

const serverChannel = '528849382196379650'
const murderMessage = '644776579809017877'
const minigamesMessage = '644776606451367962'
const eventsMessage = '653106986606657546'

async function updateMurder (message: Message) {
  const ip = '172.105.170.249'
  const gamedata = await gamedig.query({ type: 'garrysmod', host: ip })

  const embed = new MessageEmbed()
    .setColor('#e84118')
    .setTitle('🕹️ Murder')
    .setDescription(`Click: steam://connect/${ip} to join`)
    .addField('Players', `${gamedata.players.length || 0}/${gamedata.maxplayers || 0}`, true)
    .addField('Map', `${gamedata.map}`, true)
    .setThumbnail(`https://fluffyservers.com/mapicons/${gamedata.map}.jpg`)
    .setTimestamp()
  message.edit(embed)
}

async function updateMinigames (message: Message) {
  const ip = '149.28.161.120'
  const gamedata = await gamedig.query({ type: 'garrysmod', host: ip })
  const gamemode = (gamedata.raw as any).game
  const embed = new MessageEmbed()
    .setColor('#fbc531')
    .setTitle('🕹️ Minigames')
    .setDescription(`Click: steam://connect/${ip} to join\n Type \`!role minigames\` to join the channel`)
    .addField('Players', `${gamedata.players.length || 0}/${gamedata.maxplayers || 0}`, true)
    .addField('Password', '`pleaseletmein`', true)
    .addField('Playing', `${gamemode} on ${gamedata.map}`, false)
    .setThumbnail(`https://fluffyservers.com/mg/maps/${gamedata.map}.jpg`)
    .setTimestamp()
  message.edit(embed)
}

async function updateEvents (client: Client, message: Message) {
  message.edit(getEventTable(client, message.guild))
}

export default {
  description: 'Update game server information in the welcome channel',
  frequency: 5,

  async execute (client: Client) {
    const channel = client.channels.cache.get(serverChannel) as TextChannel
    channel.messages.fetch(murderMessage).then(updateMurder)
    channel.messages.fetch(minigamesMessage).then(updateMinigames)
    channel.messages.fetch(eventsMessage).then(m => { updateEvents(client, m) })
  }
}

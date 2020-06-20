const gamedig = require('gamedig')
const discord = require('discord.js')

function updateMurder(message) {
  const ip = '172.105.170.249'
  gamedig.query({ type: 'garrysmod', host: ip }).then(result => {
    // Generate a nice looking embed
    const embed = new discord.MessageEmbed()
      .setColor('#e84118')
      .setTitle('🕹️ Murder')
      .setDescription(`Click: steam://connect/${ip} to join`)
      .addField('Players', `${result.players.length || 0}/${result.maxplayers || 0}`, true)
      .addField('Map', `${result.map}`, true)
      .setThumbnail(`https://fluffyservers.com/mapicons/${result.map}.jpg`)
      .setTimestamp()
    message.edit(embed)
  }).catch(e => { })
}

function updateMinigames(message) {
  const ip = '149.28.161.120'
  gamedig.query({ type: 'garrysmod', host: ip }).then(result => {
    // Generate a nice looking embed
    const embed = new discord.MessageEmbed()
      .setColor('#fbc531')
      .setTitle('🕹️ Minigames')
      .setDescription(`Click: steam://connect/${ip} to join\n Type \`!role minigames\` to join the channel`)
      .addField('Players', `${result.players.length || 0}/${result.maxplayers || 0}`, true)
      .addField('Password', "`pleaseletmein`", true)
      .addField('Playing', `${result.raw.game} on ${result.map}`, false)
      .setThumbnail(`https://fluffyservers.com/mg/maps/${result.map}.jpg`)
      .setTimestamp()
    message.edit(embed)
  }).catch(e => { })
}

const serverChannel = '528849382196379650'
const murderMessage = '644776579809017877'
const minigamesMessage = '644776606451367962'

module.exports = {
  description: 'Update the server information in the welcome channel',
  frequency: 5,
  execute(client) {
    try {
      const channel = client.channels.cache.get(serverChannel)
      channel.messages.fetch(murderMessage).then(updateMurder)
      channel.messages.fetch(minigamesMessage).then(updateMinigames)
    } catch (e) {
      console.error(e)
    }
  }
}

const discord = require('discord.js')
const https = require('https')

module.exports = {
  name: 'stats',
  description: 'Fetchs statistics from Simply Murder',
  aliases: ['murderstats'],
  guilds: ['309951255575265280'],
  execute(message, args) {
    if (!args.length || args.length < 1) { return }

    // Friendly join multiple arguments
    if (args.length > 1) {
      args[0] = args.join(' ')
    }

    // Query Fluffy Servers API
    const url = 'https://fluffyservers.com/api/stats/search/' + args[0]
    https.get(url, resp => {
      let data = ''

      resp.on('data', chunk => {
        data += chunk
      })

      resp.on('end', () => {
        try {
          const result = JSON.parse(data).results[0]
          // Generate a fancy looking embed with the user statistics
          const embed = new discord.MessageEmbed()
            .setColor('#e84118')
            .setTitle(`Stats for ${result.username}`)
            .addField('Hours Played', `${Math.floor(result.playtime / 3600) || 0}`, false)
            .addField('Stats Profile', `http://fluffyservers.com/profile.html?steamid=${result.steamid64}`, false)
          message.channel.send(embed)
        } catch (e) {
          message.channel.send('User not found in database')
        }
      })
    })
  }
}

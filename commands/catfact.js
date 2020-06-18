const discord = require('discord.js')
const https = require('https')

const CAT_FACT_URL = 'https://catfact.ninja/fact'

module.exports = {
  name: 'catfact',
  description: 'Get a random cat fact',
  cooldown: 10,
  execute(message, args) {
    // Grab a random cat fact from the URL
    https.get(CAT_FACT_URL, resp => {
      let data = ''

      resp.on('data', chunk => {
        data += chunk
      })

      resp.on('end', () => {
        // Send the embed
        const fact = JSON.parse(data).fact

        const embed = new discord.MessageEmbed()
          .setColor('#9c88ff')
          .setDescription(fact)
        message.channel.send(embed)
      })
    })
  }
}

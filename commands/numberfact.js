const discord = require('discord.js')
const http = require('http')

module.exports = {
  name: 'numberfact',
  description: 'Get a random number fact\nFor a fact about a specific number: `!numberfact [number]`',
  cooldown: 10,
  guilds: ['309951255575265280'],
  execute(message, args) {
    let url
    const number = args[0] ? args[0].replace('.', '').replace(',', '') : null

    // Get the url to search
    if (number) {
      if (Math.random() < 0.8) {
        url = 'http://numbersapi.com/' + number + '/trivia'
      } else {
        url = 'http://numbersapi.com/' + number + '/math'
      }
    } else {
      if (Math.random() < 0.8) {
        url = 'http://numbersapi.com/random/trivia'
      } else {
        url = 'http://numbersapi.com/random/math'
      }
    }

    http.get(url, function (resp) {
      let data = ''

      resp.on('data', function (chunk) {
        data += chunk
      })

      resp.on('end', function () {
        data = data.split(' ')
        const number = data.shift()
        if (isNaN(number)) {
          message.channel.send('Something went wrong fetching a number fact.')
          return
        }

        const embed = new discord.RichEmbed()
          .setColor('#9c88ff')
          .setTitle(number)
          .setDescription(data.join(' '))
        message.channel.send(embed)
      })
    })
  }
}

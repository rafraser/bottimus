const discord = require('discord.js')
const http = require('http')

module.exports = {
  name: 'numberfact',
  description: 'Get a random number fact',
  cooldown: 10,
  execute (message, args) {
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
        var number = data.shift()
        if (isNaN(number)) {
          message.channel.send('Something went wrong fetching a number fact.')
          return
        }
        var description = data.join(' ')

        var embed = new discord.RichEmbed()
          .setColor('#9c88ff')
          .setTitle(number)
          .setDescription(description)
        message.channel.send(embed)
      })
    })
  }
}

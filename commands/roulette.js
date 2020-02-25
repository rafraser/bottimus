const arcade = require('../util/arcade')
const pool = require('../util/database')
const discord = require('discord.js')

module.exports = {
  name: 'roulette',
  description: 'Roulette!',
  execute(message, args, client) {
    client.executePython('roulette').then(function (data) {
      var attachment = new discord.Attachment('./img/roulette.gif')
      message.channel.send(attachment).then(function () {
        setTimeout(function () {
          message.channel.send(data)
        }, 6500)
      })
    }).catch(function (err) {
      message.channel.send(err.toString())
    })
  }
}

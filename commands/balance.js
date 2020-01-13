const arcade = require('../arcade')
const discord = require('discord.js')

module.exports = {
  name: 'balance',
  description: 'Get Arcade points information',
  cooldown: 10,
  aliases: ['credits'],
  execute (message, args, client) {
    arcade.getArcadeCredits(message.member.id).then(function (amount) {
      var coin = client.emojis.get('631834832300670976')
      if (amount > 0) {
        message.channel.send(`Balance: ${amount}${coin}`)
      } else {
        message.channel.send(`You don't have any coins! Go play some games and earn some ${coin}`)
      }
    })
  }
}

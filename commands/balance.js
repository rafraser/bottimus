const arcade = require('../util/arcade')

module.exports = {
  name: 'balance',
  description: 'Get Arcade points information',
  cooldown: 10,
  aliases: ['credits', 'bal'],
  execute(message, args, client) {
    const user = client.findUser(message, args, true)
    arcade.getArcadeCredits(user.id).then(function (amount) {
      const coin = client.emojis.get('631834832300670976')
      if (amount > 0) {
        message.channel.send(`Balance: ${amount}${coin}`)
      } else {
        message.channel.send(`You don't have any coins! Go play some games and earn some ${coin}`)
      }
    })
  }
}

const arcade = require('../util/arcade')

module.exports = {
  name: 'balance',
  description: 'See how many coins you have.\nYou can obtain more coins by playing games or gambling - don\'t forget your `!dailyspin` once per day.\nTo view someone else\'s balance: `!balance [user]`',
  cooldown: 10,
  aliases: ['credits', 'bal'],
  execute(message, args, client) {
    const user = client.findUser(message, args, true)
    arcade.getArcadeCredits(user.id).then(function (amount) {
      const coin = client.emojis.get('631834832300670976')
      if (amount > 0) {
        message.channel.send(`${user.displayName}'s Balance: ${coin} **${amount}**`)
      } else {
        message.channel.send(`No coins! Go play some games and earn some ${coin}`)
      }
    })
  }
}

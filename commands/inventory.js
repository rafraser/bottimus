const arcade = require('../util/arcade')
const discord = require('discord.js')

module.exports = {
  name: 'inventory',
  description: 'Display all the prizes collected so far. Can you get all 30?\nTo view someone else\'s inventory: `!inventory [user]`',
  cooldown: 15,
  execute(message, args, client) {
    const user = client.findUser(message, args, true)
    arcade.getArcadePrizes(user.id).then(function (prizes) {
      let prizes2 = ['--prizes']
      for (const prize in prizes) {
        prizes2.push(prize + ':' + prizes[prize])
      }

      client.executePython('inventory', prizes2).then(function () {
        const attachment = new discord.Attachment('./img/inventory.png')
        message.channel.send(attachment)
      })
    })
  }
}

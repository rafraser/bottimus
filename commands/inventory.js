const arcade = require('../util/arcade')
const discord = require('discord.js')

module.exports = {
  name: 'inventory',
  description: 'Display the prize inventory',
  cooldown: 30,
  execute(message, args, client) {
    arcade.getArcadePrizes(message.member.id).then(function (prizes) {
      let prizes2 = []
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

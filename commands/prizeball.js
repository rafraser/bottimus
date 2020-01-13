const arcade = require('../arcade')
const discord = require('discord.js')

function getPrizeRarities () {
  var rarities = {}
  for (var rarity of arcade.rarities) {
    rarities[rarity] = []
  }

  for (var prize in arcade.prizes) {
    var p = arcade.prizes[prize]
    var r = arcade.rarities[p[1]]
    rarities[r].push(prize)
  }

  return rarities
}

function pickPrize () {
  var prizelist = getPrizeRarities()

  var p = Math.random()
  var rarity = 'Common'
  if (p > 0.9) {
    rarity = 'Legendary'
  } else if (p > 0.7) {
    rarity = 'Rare'
  } else if (p > 0.4) {
    rarity = 'Uncommon'
  }

  var r = prizelist[rarity]
  return r[Math.floor(Math.random() * r.length)]
}

function openPrizeBall (msg, prize, user, client) {
  var p = arcade.prizes[prize]
  var args = ['prizes/' + prize, arcade.rarities[p[1]], arcade.rarities[p[1]] + ' Prize!', arcade.prizes[prize][0]]
  client.executePython('prizeball', args).then(function () {
    var attachment = new discord.Attachment('./img/prizeball.gif')
    msg.channel.send(attachment)
  })
}

function redeemPrize (msg, user, client) {
  msg.clearReactions()
  msg.edit('Get ready!')
  var prize = pickPrize()
  arcade.unlockArcadePrize(user, prize)
  openPrizeBall(msg, prize, user, client)
}

module.exports = {
  name: 'prizeball',
  description: 'Try your luck at the legendary prize ball machine!',
  cooldown: 60,
  aliases: ['redeemprize', 'prize'],
  execute (message, args, client) {
    arcade.getArcadeCredits(message.member.id).then(function (amount) {
      if (amount < 1000) {
        message.channel.send('You need at least 1000 coins for this!')
      } else {
        // Send a confirmation message
        message.channel.send('Redeeming a prize costs 1000 coins: react to confirm').then(function (msg) {
          msg.react('✅')
          const filter = function (reaction, user) {
            return user.id === message.member.id && reaction.emoji.name === '✅'
          }

          var collector = msg.createReactionCollector(filter, { time: 5000 })
          collector.on('collect', function () {
            // Confirmation received!
            collector.stop()
            arcade.incrementArcadeCredits(message.member.id, -1000)
            redeemPrize(msg, message.member.id, client)
          })
        })
      }
    })
  }
}

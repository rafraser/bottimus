const arcade = require('../util/arcade')
const discord = require('discord.js')

function getPrizeRarities() {
  let rarities = {}
  for (const rarity of arcade.rarities) {
    rarities[rarity] = []
  }

  for (const prize in arcade.prizes) {
    const p = arcade.prizes[prize]
    const r = arcade.rarities[p[1]]
    rarities[r].push(prize)
  }

  return rarities
}

function pickPrize() {
  const prizelist = getPrizeRarities()

  const p = Math.random()
  let rarity = 'Common'
  if (p > 0.9) {
    rarity = 'Legendary'
  } else if (p > 0.7) {
    rarity = 'Rare'
  } else if (p > 0.4) {
    rarity = 'Uncommon'
  }

  const r = prizelist[rarity]
  return r[Math.floor(Math.random() * r.length)]
}

function openPrizeBall(msg, client, key, prize, rarity) {
  const args = ['prizes/' + key, rarity, rarity + ' Prize!', prize]
  client.executePython('prizeball', args).then(function () {
    const attachment = new discord.Attachment('./img/prizeball.gif')
    msg.channel.send(attachment)
  })
}

function redeemPrize(msg, user, client) {
  msg.clearReactions()
  msg.edit('Get ready!')
  const [key, prize, rarity] = arcade.pickPrize()
  arcade.unlockArcadePrize(user, key)
  openPrizeBall(msg, client, key, prize, rarity)
}

module.exports = {
  name: 'prize',
  description: 'Try your luck at the legendary prize ball machine! Can you get all 30 prizes?\nEach prize attempt costs 1000 coins.',
  cooldown: 40,
  aliases: ['redeemprize', 'prizeball'],
  execute(message, args, client) {
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

          const collector = msg.createReactionCollector(filter, { time: 35000 })
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
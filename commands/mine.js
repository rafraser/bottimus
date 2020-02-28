const arcade = require('../util/arcade')
const pool = require('../util/database')
const discord = require('discord.js')

function incrementStatScore(userid, amount) {
  const queryString = 'INSERT INTO arcade_mining VALUES(?, 1, ?) ON DUPLICATE KEY UPDATE number = number + 1, diamonds = diamonds + VALUES(diamonds)'
  pool.query(queryString, [userid, amount])
}

function generateMiningEmbed(msg, name, amount, over = false) {
  const embed = new discord.RichEmbed()
    .setTitle(name + '\'s Mining Expedition')
    .setColor('#5352ed')
  if (over) {
    embed.setDescription('This expedition is over!\n' + '💎'.repeat(amount))
  } else {
    embed.setDescription('Click the pickaxe to mine!\n' + '💎'.repeat(amount))
  }
  msg.edit(embed)
}

function startMiningTrip(msg, member, client) {
  // Update the message with the scratchcard
  let amount = 0
  let collecting = true
  let gameover = false
  generateMiningEmbed(msg, member.displayName, amount)

  const filter = function (reaction, u) {
    return u.id === member.id && reaction.emoji.name === '⛏' && collecting
  }

  msg.clearReactions().then(function () {
    // Start watching for the pickaxe clicking
    msg.react('⛏')
    const collector = msg.createReactionCollector(filter, { time: 30000 })
    collector.on('collect', function (reaction) {
      collecting = false
      reaction.remove(member).then(function () {
        if (collecting || gameover) return

        amount++
        generateMiningEmbed(msg, member.displayName, amount)
        collecting = true
      })
    })

    // Finish the expedition and announce the earnings
    collector.on('end', function () {
      // Cleanup game
      msg.clearReactions()
      gameover = true
      collecting = false

      // Announce results
      const coin = client.emojis.get('631834832300670976')
      generateMiningEmbed(msg, member.displayName, amount, true)
      msg.channel.send(`💎 ${amount} diamonds collected\n${coin} ${amount * 5} coins earned`)

      // Send results to the database
      arcade.incrementArcadeCredits(member.id, amount * 5)
      incrementStatScore(member.id, amount)
    })
  })
}

module.exports = {
  name: 'mine',
  description: '-',
  cooldown: 180,
  execute(message, args, client) {
    arcade.getArcadeCredits(message.member.id).then(function (amount) {
      if (amount < 25) {
        message.channel.send('You need at least 25 coins for this!')
      } else {
        // Send a confirmation message
        message.channel.send('Going on a mining expedition costs 25 coins: react to confirm').then(function (msg) {
          msg.react('✅')
          const filter = function (reaction, user) {
            return user.id === message.member.id && reaction.emoji.name === '✅'
          }

          const collector = msg.createReactionCollector(filter, { time: 10000 })
          collector.on('collect', function () {
            // Confirmation received!
            collector.stop()
            arcade.incrementArcadeCredits(message.member.id, -25)
            startMiningTrip(msg, message.member, client)
          })
        })
      }
    })
  }
}

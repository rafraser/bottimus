import { Client, Message } from '../command'
import { MessageEmbed, User, MessageReaction } from 'discord.js'
import { incrementArcadeCredits, unlockArcadePrize } from '../arcade'
import { queryHelper } from '../database'

function incrementStatScore (userid: string, amount: number) {
  const queryString = 'INSERT INTO arcade_mining VALUES(?, 1, ?) ON DUPLICATE KEY UPDATE number = number + 1, diamonds = diamonds + VALUES(diamonds)'
  return queryHelper(queryString, [userid, amount])
}

function generateMiningEmbed (msg: Message, name: string, amount: number, over: boolean = false) {
  const embed = new MessageEmbed()
    .setTitle(name + '\'s Mining Expedition')
    .setColor('#5352ed')
  if (over) {
    embed.setDescription('This expedition is over!\n' + '💎'.repeat(amount))
  } else {
    embed.setDescription('Click the pickaxe to mine!\n' + '💎'.repeat(amount))
  }
  msg.edit(embed)
}

export function miningPrizeCheck (pickaxeUnlocked: boolean) {
  // If the pickaxe is unlocked, ores will drop more frequently
  let r = Math.random()
  if (pickaxeUnlocked) {
    r += 0.15
  };

  if (r > 0.95) {
    return ['oregreen', 'Uranium Ore']
  } else if (r > 0.90) {
    return ['oregold', 'Gold Ore']
  } else if (r > 0.825) {
    return ['oresilver', 'Silver Ore']
  } else {
    return null
  }
}

export default {
  name: 'mine',
  description: 'Mine diamonds to earn coins. Each diamond is worth 2 coins.\nClick on the pickaxe repeatedly. Due to Discord limits, it may take a moment before each diamond is mined.',
  cooldown: 200,

  async execute (client: Client, message: Message, args: string[]) {
    const msg = await message.channel.send('Get ready!')
    client.updateCooldown(this, message.member.id)

    const member = message.member
    let amount = 0
    let collecting = true
    let gameover = false
    generateMiningEmbed(msg, member.displayName, amount)

    const filter = (reaction: MessageReaction, u: User) => {
      return u.id === message.member.id && reaction.emoji.name === '⛏' && collecting
    }

    // Start watching for pickaxe clicking
    msg.react('⛏')
    const collector = msg.createReactionCollector(filter, { time: 30000 })
    collector.on('collect', async reaction => {
      collecting = false
      await reaction.users.remove(member)
      if (collecting || gameover) return

      amount++
      generateMiningEmbed(msg, member.displayName, amount)
      collecting = true
    })

    collector.on('end', _ => {
      msg.reactions.removeAll()
      gameover = true
      collecting = false

      const coin = client.getCoinEmoji()
      generateMiningEmbed(msg, member.displayName, amount, true)
      msg.channel.send(`💎 ${amount} diamonds collected\n${coin} ${amount * 2} coins earned`)

      // Rare chance of additional prizes
      const prize = miningPrizeCheck(false)
      if (prize && amount >= 5) {
        const [prizeUnlock, prizeName] = prize
        unlockArcadePrize(member.id, prizeUnlock)
        msg.channel.send(`You found a rare **${prizeName}** during this expedition! It has been added to your inventory.`)
      }

      // Send results to the database
      incrementArcadeCredits(member.id, amount * 2)
      incrementStatScore(member.id, amount)
    })
  }
}

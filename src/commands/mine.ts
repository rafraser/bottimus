import { Client, Message } from '../command'
import { MessageActionRow, MessageEmbed, MessageButton } from 'discord.js'
import { incrementArcadeCredits, unlockArcadePrize } from '../arcade'
import { queryHelper } from '../database'

function incrementStatScore (userid: string, amount: number) {
  const queryString = 'INSERT INTO arcade_mining VALUES(?, 1, ?) ON DUPLICATE KEY UPDATE number = number + 1, diamonds = diamonds + VALUES(diamonds)'
  return queryHelper(queryString, [userid, amount])
}

async function generateMiningEmbed (msg: Message, name: string, amount: number, over: boolean = false) {
  const embed = new MessageEmbed()
    .setTitle(name + '\'s Mining Expedition')
    .setColor('#5352ed')
  if (over) {
    embed.setDescription('This expedition is over!\n' + '💎'.repeat(amount))
  } else {
    embed.setDescription('Click the pickaxe to mine!\n' + '💎'.repeat(amount))
  }

  const row = new MessageActionRow().addComponents([
    new MessageButton()
      .setCustomId('mine')
      .setLabel('⛏ Mine!')
      .setStyle('PRIMARY')
      .setDisabled(over)
  ])
  await msg.edit({ embeds: [embed], components: [row] })
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
    await generateMiningEmbed(msg, member.displayName, amount)

    // Start watching for pickaxe clicking
    const collector = msg.createMessageComponentCollector({ componentType: 'BUTTON', time: 25000 })
    collector.on('collect', async interaction => {
      if (interaction.member !== member) return
      amount++

      await interaction.deferUpdate()
      await generateMiningEmbed(msg, member.displayName, amount)
    })

    collector.on('end', _ => {
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

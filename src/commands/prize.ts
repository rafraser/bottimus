import { Client, Message } from '../command'
import { User, MessageReaction, GuildMember, MessageAttachment } from 'discord.js'
import { getArcadeCredits, incrementArcadeCredits, pickPrize, unlockArcadePrize } from '../arcade'

function openPrizeBall (msg: Message, client: Client, key: string, prize: string, rarity: string) {
  const args = ['prizes/' + key, '--color', rarity, '--toptext', rarity + ' Prize!', '--bottomtext', prize]
  client.executePython('prizeball', args).then(() => {
    const attachment = new MessageAttachment('./img/prizeball.gif')
    msg.channel.send(attachment)
  })
}

function redeemPrize (msg: Message, user: GuildMember, client: Client) {
  msg.reactions.removeAll()
  msg.edit('Get ready!')
  const [key, prize, rarity] = pickPrize()
  unlockArcadePrize(user.id, key)
  openPrizeBall(msg, client, key, prize, rarity)

  // Announce prize after 10 seconds
  setTimeout(() => {
    msg.channel.send(`Congrats, ${user.displayName}! You won **${prize}**!`)
  }, 12500)
}

export default {
  name: 'prize',
  description: 'Try your luck at the legendary prize ball machine! Can you get all 30 prizes?\nEach prize attempt costs 1000 coins.',
  cooldown: 30,
  aliases: ['redeemprize', 'prizeball'],

  async execute (client: Client, message: Message, args: string[]) {
    const amount = await getArcadeCredits(message.member.id)
    if (amount < 1000) {
      message.channel.send('You need at least **1000** coins for this!')
      return
    }

    const msg = await message.channel.send('Redeeming a prize costs **1000** coins: react to confirm')
    msg.react('✅')

    const filter = (reaction: MessageReaction, user: User) => {
      return user.id === message.member.id && reaction.emoji.name === '✅'
    }

    const collector = msg.createReactionCollector(filter, { time: 10000 })
    collector.on('collect', () => {
      // Confirmation received!
      collector.stop()
      incrementArcadeCredits(message.member.id, -1000)
      redeemPrize(msg, message.member, client)
      client.updateCooldown(this, message.member.id)
    })
  }
}

import { Client, Message } from '../command'
import { getArcadeCredits } from '../arcade'

export default {
  name: 'balance',
  description: 'See how many coins you have.\nYou can obtain more coins by playing games or gambling - don\'t forget your `!dailyspin` once per day.\nTo view someone else\'s balance: `!balance [user]`',
  cooldown: 10,
  aliases: ['credits', 'bal'],

  async execute (client: Client, message: Message, args: string[]) {
    try {
      const user = await client.findUser(message, args, true)
      const amount = await getArcadeCredits(user.id)
      const coin = client.getCoinEmoji()
      client.updateCooldown(this, message.member.id)

      if (amount > 0) {
        message.channel.send(`${user.displayName}'s Balance: ${coin} **${amount}**`)
      } else {
        message.channel.send(`No coins! Go play some games and earn some ${coin}`)
      }
    } catch (e) {
      message.channel.send(e.message)
    }
  }
}

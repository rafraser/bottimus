import { Client, Message } from '../command'
import { queryHelper } from '../database'
import { padOrTrim, padOrTrimLeft } from '../utils'

export default {
  name: 'messages',
  description: 'Show the top users in the server, by number of messages',
  cooldown: 3,
  guilds: ['309951255575265280'],

  async execute (client: Client, message: Message, args: string[]) {
    let user = message.member
    let page
    if (args.length < 1) {
      page = 0
    } else {
      const p = parseInt(args[0], 10)
      if (isNaN(p)) {
        user = await client.findUser(message, args.slice(), true)
      } else {
        page = p - 1
      }
    }

    if (page !== undefined && page >= 0) {
      const offset = 20 * page
      const results = await queryHelper('SELECT u.username, m.amount FROM bottimus_messages m LEFT JOIN bottimus_userdata u on m.discordid = u.discordid WHERE guild = ?ORDER BY m.amount DESC LIMIT ?, 20;', [message.guild.id, offset])
      user = message.member

      const header = 'Message counts are estimates.\n```yaml\nNum  Username             Messages\n----------------------------------\n'
      const text = results.reduce((acc, result, idx) => {
        const display = result.username || '<unknown>'
        const position = padOrTrim(`#${idx + 1 + offset}.`, 5)
        const name = padOrTrim(display, 22)
        const messages = padOrTrimLeft(result.amount.toString(), 7)
        return acc + `${position}${name}${messages}\n`
      }, header) + '```'

      message.channel.send(text)
    }

    const userMessages = await queryHelper('SELECT amount FROM bottimus_messages WHERE discordid = ? AND guild = ?', [user.id, message.guild.id])
    if (userMessages.length < 1) {
      message.channel.send(`${user.displayName} has no tracked messages`)
    } else {
      message.channel.send(`${user.displayName} has sent **${userMessages[0].amount}** messages`)
    }
    client.updateCooldown(this, message.member.id)
  }
}

import { Client, Message } from '../command'
import { TextChannel } from 'discord.js'
import { queryHelper } from '../database'
import { padOrTrim } from '../utils'

async function buildFriendsTable (client: Client, message: Message, gid: string) {
  const queryString = 'SELECT u.username, code FROM arcade_switchcode a LEFT JOIN bottimus_userdata u on a.discordid = u.discordid WHERE guild = ?'
  const results = await queryHelper(queryString, [gid])

  let result
  const header = '**Switch Codes**\nTo add your code to this list, type `!switchcode SW-1111-2222-3333`\n```yaml\n'
  if (results.length < 1) {
    result = header + 'Nobody has listed their friend code yet - be the first!```'
  } else {
    result = results.reduce((acc, result) => {
      const name = padOrTrim(result.username, 25)
      return acc + `${name} ${result.code}\n`
    }, header) + '```'
  }
  message.channel.send(result)
}

export default {
  name: 'switchcodes',
  description: 'Get a list of Switch Friend Codes for users in this server',
  cooldown: 5,
  aliases: ['switch', 'switchcode'],

  async execute (client: Client, message: Message, args: string[]) {
    // If ran with no arguments, list all user codes
    client.updateCooldown(this, message.member.id)

    const channel = message.channel as TextChannel
    if (args.length < 1) {
      buildFriendsTable(client, message, channel.guild.id)
      return
    }

    const code = args[0].match(/SW-\d{4}-\d{4}-\d{4}/)
    if (code) {
      // Update code in the listing
      const updateString = 'INSERT INTO arcade_switchcode VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE code = VALUES(code);'
      await queryHelper(updateString, [message.member.id, channel.guild.id, code[0]])
      channel.send('Friend code updated successfully ✅')
    } else if (args[0] === 'remove') {
      // Remove code from listing
      const updateString = 'DELETE FROM arcade_switchcode WHERE discordid = ? AND guild = ?;'
      await queryHelper(updateString, [message.member.id, channel.guild.id])
      channel.send('Friend code removed from listing ✅')
    } else {
      // List all user codes
      buildFriendsTable(client, message, channel.guild.id)
    }
  }
}

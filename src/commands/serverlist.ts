import { Client, Message } from '../command'
import { Guild } from 'discord.js'
import { queryHelper } from '../database'
import { padOrTrim } from '../utils'

async function getServerData (client: Client, guild: Guild): Promise<[string, string]> {
  const id = guild.ownerID
  let owner = (await queryHelper('SELECT tag FROM bottimus_userdata WHERE discordid = ?', [id]))[0]
  if (owner) {
    owner = owner.tag
  } else {
    owner = 'Unknown Owner'
  }

  return [padOrTrim(guild.name, 30), padOrTrim(owner, 20)]
}

export default {
  name: 'serverlist',
  description: 'List all servers that the bot is in',
  guilds: ['786168512795901962'],

  async execute (client: Client, message: Message, args: string[]) {
    // Restrict to administrators
    if (!client.isAdministrator(message.member)) {
      return
    }

    // Build a table of server names and owners
    const servers = await Promise.all(client.guilds.cache.map(x => getServerData(client, x)))
    const serverString = servers.reduce((str, server) => str + `${server[0]}  ${server[1]}\n`, '```\n')
    message.channel.send(serverString + '```')
  }
}

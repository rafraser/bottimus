import { Client, Message } from "../command"
import { Guild } from "discord.js"
import { queryHelper } from "../database"

async function getServerData(client: Client, guild: Guild): Promise<[string, string]> {
    let id = guild.ownerID
    let owner = (await queryHelper('SELECT tag FROM bottimus_userdata WHERE discordid = ?', [id]))[0]
    if (owner) {
        owner = owner.tag
    } else {
        owner = 'Unknown Owner'
    }

    return [client.padOrTrim(guild.name, 30), client.padOrTrim(owner, 20)]
}

export default {
    name: 'serverlist',
    description: 'List all servers that the bot is in',
    guilds: ['309951255575265280'],

    async execute(client: Client, message: Message, args: string[]) {
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
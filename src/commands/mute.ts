import { Client, Message } from "../command"
import { queryHelper } from "../database"
import { getMutedRole } from "../settings"
import { timeToString } from "../utils"
import { Guild, GuildMember, TextChannel, MessageEmbed, Channel } from "discord.js"

export async function isMuted(guild: Guild, target: GuildMember): Promise<boolean | [string, string, Date]> {
    const queryString = 'SELECT * FROM mute_data WHERE guild = ? AND member = ? AND active = 1'
    const data = await queryHelper(queryString, [guild.id, target.id])
    if (data && data.length >= 1) {
        return [data[0].guild, data[0].member, data[0].expiry]
    } else {
        return false
    }
}

export async function addMute(guild: Guild, target: GuildMember, roleId: string, channel: TextChannel, duration: number = 30) {
    let revoke = new Date(Date.now() + duration * 60000)
    const roles = target.roles.cache
    const roleIds = roles.map(role => role.id)

    // Save to the database
    const queryString = 'INSERT INTO mute_data VALUES (?, ?, ?, ?, ?, 1)'
    await queryHelper(queryString, [guild.id, target.id, channel.id, revoke, JSON.stringify(roleIds)])

    // Add the muted role
    let role = guild.roles.cache.get(roleId)
    target.roles.add(role)

    // Remove all other roles
    // We need this forEach loop vs removeRoles in the case of un-removable roles
    // eg. Nitro Boost
    roles.forEach(role => {
        if (role.id === roleId || role.name === '@everyone') return
        target.roles.remove(role).catch(() => { })
    })
}

export async function revokeMute(client: Client, guild: Guild, target: GuildMember, args: [string, string, Date]) {
    // Remove the mute role
    const mute = getMutedRole(client.serverSettings, guild.id)
    if (mute) {
        let role = guild.roles.cache.get(mute)
        await target.roles.remove(role)
    }

    // Fetch the other roles from the database
    const queryString1 = 'SELECT roles, channel FROM mute_data WHERE guild = ? AND member = ? AND expiry = ?'
    let data = await queryHelper(queryString1, args)
    if (data && data.length >= 1) {
        let roleIds = JSON.parse(data[0].roles)
        roleIds.forEach((id: string) => {
            if (id == mute) return
            const role = guild.roles.cache.get(id)
            if (role.name == '@everyone') return
            target.roles.add(role).catch(() => { })
        })

        let channel = guild.channels.cache.get(data[0].channel) as TextChannel
        channel.send(target.displayName + ' has been unmuted')
    }

    // Save to the database
    const queryString2 = 'UPDATE mute_data SET active = 0 WHERE guild = ? AND member = ? AND expiry = ?'
    await queryHelper(queryString2, args)
}

export default {
    name: 'mute',
    description: '🛡️ Mute a specified user',
    aliases: ['banish', 'void', 'kill'],

    async execute(client: Client, message: Message, args: string[]) {
        // Check that this server has a mute role configured
        const mute = getMutedRole(client.serverSettings, message.guild.id)
        if (!mute) return

        // Check that the user has permission
        if (!client.isModerator(message.member)) {
            message.channel.send('You need to be a Moderator to use this!')
            return
        }

        // Check if the user is already muted
        const target = await client.findUser(message, args)
        const muteData = await isMuted(message.guild, target)
        if (muteData) {
            revokeMute(client, message.guild, target, muteData as [string, string, Date])
        } else {
            // Don't mute administrators
            if (client.isAdministrator(target)) {
                message.channel.send('You cannot mute Administrators!')
                // return
            }

            // Search the arguments until a duration is found
            let duration = 30
            for (let i = 0; i < args.length; i++) {
                let a = parseInt(args[i], 10)
                if (!isNaN(a)) {
                    duration = a
                    break
                }
            }

            const channel = message.channel as TextChannel
            await addMute(message.guild, target, mute, channel, duration)

            let embed = new MessageEmbed()
                .setColor('#c0392b')
                .setTitle('🦀 ' + target.displayName + ' is gone 🦀')
                .setDescription('They have been banished to the void for ' + timeToString(duration * 60 * 1000))
            message.channel.send(embed)
        }
    }
}
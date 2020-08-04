import { Client, Message } from "../command"
import { queryHelper } from "../database"
import { getTicketRole } from "../settings"
import { timeToString } from "../utils"
import { Guild, GuildMember, TextChannel, MessageEmbed } from "discord.js"

export async function isTicketed(guild: Guild, target: GuildMember): Promise<boolean | [string, string, Date]> {
    const queryString = 'SELECT * FROM ticket_data WHERE guild = ? AND member = ? AND active = 1'
    const data = await queryHelper(queryString, [guild.id, target.id])
    if (data && data.length >= 1) {
        return [data[0].guild, data[0].member, data[0].expiry]
    } else {
        return false
    }
}

export async function addTicket(guild: Guild, target: GuildMember, roleId: string, channel: TextChannel, duration: number = 30) {
    let revoke = new Date(Date.now() + duration * 60000)

    // Save to the database
    const queryString = 'INSERT INTO ticket_data VALUES (?, ?, ?, ?, 1)'
    await queryHelper(queryString, [guild.id, target.id, channel.id, revoke])

    // Add the ticket role
    let role = guild.roles.cache.get(roleId)
    target.roles.add(role)
}

export async function revokeTicket(client: Client, guild: Guild, target: GuildMember, args: [string, string, Date]) {
    // Remove the ticket role
    const ticket = getTicketRole(client.serverSettings, guild.id)
    if (ticket) {
        let role = guild.roles.cache.get(ticket)
        await target.roles.remove(role)
    }

    // Save to the database
    const queryString = 'UPDATE ticket_data SET active = 0 WHERE guild = ? AND member = ? AND expiry = ?'
    await queryHelper(queryString, args)
}

export default {
    name: 'ticket',
    description: '🛡️ Assign a temporary ticket to a user',
    aliases: ['giveticket', 'admitone'],

    async execute(client: Client, message: Message, args: string[]) {
        // Check that this server has a ticket role configured
        const ticket = getTicketRole(client.serverSettings, message.guild.id)
        if (!ticket) return

        // Check that the user has permission
        if (!client.isAdministrator(message.member)) {
            message.channel.send('You need to be an Administrator to use this!')
            return
        }

        const target = client.findUser(message, args)

        // Check if a ticket is already owned
        const ticketData = await isTicketed(message.guild, target)
        if (ticketData) {
            revokeTicket(client, message.guild, target, ticketData as [string, string, Date])
            message.channel.send('Ticket revoked!')
        } else {
            // Search the arguments until a duration is found
            let duration = 60
            for (let i = 0; i < args.length; i++) {
                let a = parseInt(args[i], 10)
                if (!isNaN(a)) {
                    duration = a
                    break
                }
            }

            const channel = message.channel as TextChannel
            await addTicket(message.guild, target, ticket, channel, duration)

            let embed = new MessageEmbed()
                .setColor('#ff9f43')
                .setTitle('🎟️ ' + target.displayName + ' has a ticket 🎟️')
                .setDescription('It is valid for the next ' + timeToString(duration * 60 * 1000))
            message.channel.send(embed)
        }
    }
}
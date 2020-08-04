import { Client, Updater } from "../updater"
import { queryHelper } from "../database"
import { revokeTicket } from "../commands/ticket"
import { TextChannel } from "discord.js"

export default {
    description: "Handle revoking tickets",
    frequency: 3,

    async execute(client: Client) {
        const queryString = 'SELECT guild, member, expiry FROM ticket_data WHERE active = 1'
        let currentTickets = await queryHelper(queryString, [])

        if (currentTickets && currentTickets.length >= 1) {
            currentTickets.forEach(async ticketData => {
                if (Date.now() > ticketData.expiry.getTime()) {
                    let guild = client.guilds.cache.get(ticketData.guild)
                    let member = await guild.members.fetch(ticketData.member)
                    revokeTicket(client, guild, member, [ticketData.guild, ticketData.member, ticketData.expiry])
                }
            })
        }
    }
}
import { Client } from '../updater'
import { queryHelper } from '../database'
import { revokeTicket } from '../commands/ticket'

export default {
  description: 'Handle revoking tickets',
  frequency: 3,

  async execute (client: Client) {
    const queryString = 'SELECT guild, member, expiry FROM ticket_data WHERE active = 1'
    const currentTickets = await queryHelper(queryString, [])

    if (currentTickets && currentTickets.length >= 1) {
      currentTickets.forEach(async ticketData => {
        if (Date.now() > ticketData.expiry.getTime()) {
          const guild = client.guilds.cache.get(ticketData.guild)
          const member = await guild.members.fetch(ticketData.member)
          revokeTicket(client, guild, member, [ticketData.guild, ticketData.member, ticketData.expiry])
        }
      })
    }
  }
}

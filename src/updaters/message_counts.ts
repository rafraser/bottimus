import { Client } from '../updater'
import { queryHelper } from '../database'

export async function saveMessageCounts (client: Client) {
  client.messageCounts.forEach(async (guildCounts, guildId) => {
    guildCounts.forEach(async (count, memberId) => {
      const queryString = 'INSERT INTO bottimus_messages VALUES(?, ?, ?, NULL) ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount)'
      await queryHelper(queryString, [memberId, guildId, count])
    })
  })

  client.messageCounts = new Map()
}

export default {
  description: 'Save message counts data to the database',
  frequency: 5,

  async execute (client: Client) {
    saveMessageCounts(client)
  }
}

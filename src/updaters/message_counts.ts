import { Client, Updater } from "../updater"
import { queryHelper } from "../database"

export async function saveMessageCounts(client: Client) {
    client.messageCounts.forEach(async (guild_counts, guild_id) => {
        guild_counts.forEach(async (count, member_id) => {
            const queryString = 'INSERT INTO bottimus_messages VALUES(?, ?, ?, NULL) ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount)'
            await queryHelper(queryString, [member_id, guild_id, count])
        })
    })

    client.messageCounts = new Map()
}

export default {
    description: "Save message counts data to the database",
    frequency: 5,

    async execute(client: Client) {
        saveMessageCounts(client)
    }
}
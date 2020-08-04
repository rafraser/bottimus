import { Client, Updater } from "../updater"
import { queryHelper } from "../database"
import { revokeMute } from "../commands/mute"
import { TextChannel } from "discord.js"

export default {
    description: "Handle unmuting users",
    frequency: 3,

    async execute(client: Client) {
        const queryString = 'SELECT guild, member, expiry FROM mute_data WHERE active = 1'
        let currentMutes = await queryHelper(queryString, [])
        if (currentMutes && currentMutes.length >= 1) {
            currentMutes.forEach(async muteData => {
                if (Date.now() > muteData.expiry.getTime()) {
                    let guild = client.guilds.cache.get(muteData.guild)
                    let member = await guild.members.fetch(muteData.member)
                    revokeMute(client, guild, member, [muteData.guild, muteData.member, muteData.expiry])
                }
            })
        }
    }
}
import { Client, Updater } from "../updater"
import { chooseRandomBanner } from "../commands/banner"

const guildId = '309951255575265280'

export default {
    description: "Update the Fluffy Servers banner",
    frequency: 720,

    async execute(client: Client) {
        let guild = client.guilds.cache.get(guildId)
        chooseRandomBanner(guild)
    }
}
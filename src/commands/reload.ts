import { Client, Message } from "../command"
import { loadEvents } from "../events"

export default {
    name: 'reload',
    description: '🛡️ Reloads essential data',
    guilds: ['309951255575265280'],

    async execute(client: Client, message: Message, args: string[]) {
        if (!client.isAdministrator(message.member)) {
            message.channel.send('You need to be an Administrator to use this!')
            return
        }

        client.loadServerSettings()
        loadEvents(client)
    }
}
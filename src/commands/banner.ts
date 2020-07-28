import { Client, Message } from "../command"

export default {
    name: 'banner',
    description: '🛡️ Set the server banner',
    guilds: ['309951255575265280'],

    async execute(client: Client, message: Message, args: string[]) {
        if (client.isAdministrator(message.member)) {
            const file = args.shift()
            message.guild.setBanner('./img/banner/' + file)
        }
    }
}

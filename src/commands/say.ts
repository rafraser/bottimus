import { Client, Message } from "../command"

export default {
    name: 'say',
    description: '🛡️ Secret admin command',
    guilds: ['309951255575265280'],

    async execute(client: Client, message: Message, args: string[]) {
        if (client.isAdministrator(message.member)) {
            message.delete()
            message.channel.send(args.join(' '))
        }
    }
}
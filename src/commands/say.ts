import { Client, Message } from "../command"

export default {
    name: 'say',
    description: '🛡️ Secret admin command',
    guilds: ['309951255575265280'],

    async execute(client: Client, message: Message, args: string[]) {
        const user = message.member
        if (client.isAdministrator(user)) {
            message.delete()
            message.channel.send(args.join(' '))
        }
    }
}
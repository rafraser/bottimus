import { Client, Message } from "../command"
import { queryHelper } from "../database"
import { padOrTrim } from "../utils"

export default {
    name: 'messages',
    description: 'Show the top users in the server, by number of messages',
    cooldown: 15,
    guilds: ['309951255575265280'],

    async execute(client: Client, message: Message, args: string[]) {
        if (args.length < 1 || args[0] != 'me') {
            let results = await queryHelper('SELECT u.username, m.amount FROM bottimus_messages m LEFT JOIN bottimus_userdata u on m.discordid = u.discordid WHERE guild = ?ORDER BY m.amount DESC LIMIT 20;', [message.guild.id])

            let header = 'Message counts are estimates.\n```yaml\nNum  Username             Messages\n----------------------------------\n'
            let text = results.reduce((acc, result, idx) => {
                let display = result.username || '<unknown>'
                const position = padOrTrim(`#${idx + 1}.`, 5)
                const name = padOrTrim(display, 23)
                const messages = padOrTrim(result.amount.toString(), 7)
                return acc + `${position}${name}${messages}\n`
            }, header) + '```'

            message.channel.send(text)
        }

        let my_messages = await queryHelper('SELECT amount FROM bottimus_messages WHERE discordid = ? AND guild = ?', [message.member.id, message.guild.id])
        message.channel.send(`\`Your messages: ${my_messages[0].amount}\``)
        client.updateCooldown(this, message.member.id)
    }
}
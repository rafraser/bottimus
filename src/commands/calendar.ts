import { Client, Message } from "../command"
import { MessageAttachment } from "discord.js"

export default {
    name: 'calendar',
    description: 'Display the current event calendar',
    guilds: ['309951255575265280'],
    cooldown: 15,

    async execute(client: Client, message: Message, args: string[]) {
        if (!client.eventsData || client.eventsData.size < 1) {
            message.channel.send('No events are currently scheduled!')
            return -1
        }

        const events2 = ['--events']
        for (const event of client.eventsData.values()) {
            events2.push(`${event.time.toUTCString()}|${event.category}|${event.title}`)
        }

        client.executePython('calendar_display', events2).then(() => {
            const attachment = new MessageAttachment('./img/calendar.png')
            message.channel.send(attachment)
        })
    }
}
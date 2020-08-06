import { Client, Message } from "../command"
import { getUpcomingEvents, formatEventDate } from "../events"
import { padOrTrim } from "../utils"
import { Event } from "../events"

function displayEvent(event: Event): string {
    let name = event.title.replace("'", "")
    let time = formatEventDate(event.time, false)
    return '\n' + padOrTrim(name, 20) + ' ' + padOrTrim(time, 25)
}

export default {
    name: 'eventlist',
    description: 'Get a list of all upcoming events',
    aliases: ['events'],

    async execute(client: Client, message: Message, args: string[]) {
        const events = getUpcomingEvents(client.eventsData, message.guild)

        // Generate a code block list
        const outputString = events.reduce((acc, val) => acc + displayEvent(val), '```cs\n# Upcoming Events #') + '```'
        message.channel.send(outputString)
    }
}
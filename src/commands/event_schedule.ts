import { Client, Message } from "../command"
import { getUpcomingEvents, formatEventDate } from "../events"
import { padOrTrim } from "../utils"
import { MessageReaction, User, TextChannel } from "discord.js"
import { Event, EventCategory } from "../events"
import { getAdminChannel } from "../settings"

const helpString = `
You can schedule events with the following syntax:
\`!schedule "Title" "Description" HH:MM YYYY-MM-DD\`

If no date is specified, it will default to today.
The icon for the event will be automatically detected based on keywords.
The following events have icons:

`

function getEventTypes() {
    return "\`" + Object.values(EventCategory).join(" ") + "\`"
}


export default {
    name: 'schedule',
    description: 'Request an event to be scheduled',
    aliases: ['planevent', 'requestevent'],
    cooldown: 60,

    async execute(client: Client, message: Message, args: string[]) {
        // Check permissions
        if (!client.isEventRole(message.member)) {
            message.channel.send('You don\'t have permission to plan events!')
            return
        }

        // Help text without arguments
        if (args.length < 1) {
            message.channel.send(helpString + getEventTypes())
        }

        // Here we go!
        let title, description, when, forcetype
        try {
            title = args.shift()
            description = args.shift()

            const now = new Date(Date.now())
            let datetime = {
                year: now.getFullYear(),
                month: now.getMonth(),
                day: now.getDate()
            } as any

            while (args.length >= 1) {
                let arg = args.shift() as string
                if (arg.startsWith('type:')) {
                    // Try parsing this argument as type
                    let argq = arg.split(':')
                    forcetype = argq[1]
                } else if (arg.includes(':')) {
                    // Try parsing this argument as time
                    let argq = arg.split(':')
                    datetime.hour = argq[0]
                    datetime.minute = argq[1]
                } else if (arg.includes('-')) {
                    // Try parsing this argument as YYYY-MM-DD
                    let argq = arg.split('-')
                    datetime.year = argq[0]
                    datetime.month = parseInt(argq[1], 10) - 1
                    datetime.day = argq[2]
                } else if (arg.includes('/')) {
                    // Try parsing this argument as DD/MM/YYYY
                    let argq = arg.split('/')
                    datetime.day = argq[0]
                    datetime.month = parseInt(argq[1], 10) - 1
                    datetime.year = arg[2]
                }
            }

            // Check that the date and time are valid
            when = new Date(datetime.year, datetime.month, datetime.day, datetime.hour, datetime.minute)
            if (!(when instanceof Date)) {
                message.channel.send('Invalid event structure. Check that the time is the right format (HH:MM)')
                return
            }

        } catch (e) {
            console.log(e)
            message.channel.send('Invalid event structure')
            return
        }

        const event = new Event(message.guild, title, description, message.member, when)
        if (forcetype) {
            event.category = forcetype as EventCategory
        }
        const embed = event.generateEventEmbed()

        // Check if the event is correct before officially posting for approval
        const msg = await message.channel.send('Is this correct?', embed)
        await msg.react('✅')
        const filter = (reaction: MessageReaction, user: User) => {
            return user.id === message.member.id && reaction.emoji.name === '✅'
        }

        const collector = msg.createReactionCollector(filter, { time: 25000 })
        collector.on('collect', async () => {
            collector.stop()

            // Send notification to administrators
            const channelID = getAdminChannel(client.serverSettings, message.guild.id)
            if (channelID) {
                const channel = message.guild.channels.cache.get(channelID) as TextChannel
                channel.send(`New event requested by **${message.member.displayName}**!`)
            }

            await event.registerEvent()
            client.eventsData.push(event)
            message.channel.send('Event has been sent to Administrators for approval!')
        })
    }
}
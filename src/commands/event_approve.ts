import { Client, Message } from "../command"
import { updateDisplayedEvent } from "../updaters/events"
import { getUnapprovedEvent, denyEvent } from "../events"
import { MessageReaction, User } from "discord.js"

export default {
    name: 'confirmevent',
    description: '🛡️ Confirm requested events',
    aliases: ['approveevent'],

    async execute(client: Client, message: Message, args: string[]) {
        if (!client.isAdministrator(message.member)) {
            message.channel.send('You need to be an Administrator to use this!')
            return
        }

        const eventUnapproved = getUnapprovedEvent(client.eventsData, message.guild)
        if (!eventUnapproved) {
            message.channel.send('No events are awaiting approval.')
            return
        }

        const embed = eventUnapproved.generateEventEmbed()
        const msg = await message.channel.send(embed)
        await msg.react('✅')
        await msg.react('❎')

        const filter = (reaction: MessageReaction, user: User) => {
            return user.id === message.member.id && (reaction.emoji.name === '✅' || reaction.emoji.name === '❎')
        }

        const collector = msg.createReactionCollector(filter, { time: 25000 })
        collector.on('collect', async r => {
            collector.stop()
            console.log('COLELCT!')
            if (r.emoji.name === '❎') {
                denyEvent(eventUnapproved.id)
                let idx = client.eventsData.indexOf(eventUnapproved)
                if (idx > -1) {
                    client.eventsData.splice(idx, 1)
                }

                message.channel.send('Event denied!')
            } else if (r.emoji.name === '✅') {
                console.log('Approvingevent!')
                eventUnapproved.approveEvent()
                await updateDisplayedEvent(client, message.guild.id, false, false)
                await message.channel.send('Event approved!')
            }
        })
    }
}
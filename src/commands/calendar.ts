import { Client, Message } from '../command'
import { getSortedEvents } from '../events'
import { MessageAttachment } from 'discord.js'

export default {
  name: 'calendar',
  description: 'Display the current event calendar',
  guilds: ['309951255575265280'],
  cooldown: 15,

  async execute (client: Client, message: Message, args: string[]) {
    const events = getSortedEvents(client.eventsData, message.guild)
    if (events.length < 1) {
      message.channel.send('No events are currently on the calendar!')
      return
    }

    const events2 = ['--events']
    for (const event of events) {
      events2.push(`${event.time.toUTCString()}|${event.category}|${event.title}`)
    }

    await client.executePython('calendar_display', events2)

    const attachment = new MessageAttachment('./img/calendar.png')
    message.channel.send(attachment)
    client.updateCooldown(this, message.member.id)
  }
}

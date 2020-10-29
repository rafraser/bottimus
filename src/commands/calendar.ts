import { Client, Message } from '../command'
import { getSortedEvents } from '../events'
import { MessageAttachment } from 'discord.js'
import { areEventsEnabled } from '../settings'

export default {
  name: 'calendar',
  description: 'Display the current event calendar',
  cooldown: 15,

  async execute (client: Client, message: Message, args: string[]) {
    if (!areEventsEnabled(client.serverSettings, message.guild.id)) return

    const events = getSortedEvents(client.eventsData, message.guild)
    if (events.length < 1) {
      message.channel.send('No events are currently on the calendar!')
      return
    }

    const events2 = ['--events']
    for (const event of events) {
      events2.push(`${event.time.toISO()}|${event.category}|${event.title}`)
    }

    await client.executePython('calendar_display', events2)

    const attachment = new MessageAttachment('./img/calendar.png')
    message.channel.send(attachment)
    client.updateCooldown(this, message.member.id)
  }
}

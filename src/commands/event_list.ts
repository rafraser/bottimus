import { Client, Message } from '../command'
import { getUpcomingEvents, formatEventDate, Event } from '../events'
import { padOrTrim } from '../utils'

import { Guild } from 'discord.js'

export function getEventTable (client: Client, guild: Guild) {
  const events = getUpcomingEvents(client.eventsData, guild)
  return events.reduce((acc, val) => acc + displayEvent(val), '```cs\n# Upcoming Events #') + '```'
}

function displayEvent (event: Event): string {
  const name = event.title.replace("'", '')
  const time = formatEventDate(event.time, false)
  return '\n' + padOrTrim(name, 33) + '   ' + padOrTrim(time, 30)
}

export default {
  name: 'eventlist',
  description: 'Get a list of all upcoming events',
  aliases: ['events'],

  async execute (client: Client, message: Message, args: string[]) {
    message.channel.send(getEventTable(client, message.guild))
  }
}

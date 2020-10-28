import { Client, Message } from '../command'
import { getUpcomingEvents, formatEventDate, Event } from '../events'
import { padOrTrim } from '../utils'

import { Guild } from 'discord.js'
import { getTimezone } from '../settings'
import { DateTime } from 'luxon'

export function getEventTable (client: Client, guild: Guild, timezone: string) {
  const events = getUpcomingEvents(client.eventsData, guild)
  return events.reduce((acc, event) => acc + displayEvent(event, timezone), '```cs\n# Upcoming Events #') + '```'
}

function displayEvent (event: Event, timezone: string): string {
  const name = event.title.replace("'", '')
  const time = formatEventDate([timezone], event.time, false)
  return '\n' + padOrTrim(name, 33) + '   ' + padOrTrim(time, 30)
}

export default {
  name: 'eventlist',
  description: 'Get a list of all upcoming events',
  aliases: ['events'],

  async execute (client: Client, message: Message, args: string[]) {
    // Default to server primary timezone
    let timezone = getTimezone(client.serverSettings, message.guild.id)

    // Check if the specified timezone is valid
    if (args.length >= 1) {
      const dt = DateTime.utc().setZone(args[0])
      if (dt.isValid) {
        timezone = args[0]
      }
    }

    message.channel.send(getEventTable(client, message.guild, timezone))
  }
}

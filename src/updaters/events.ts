import { Client } from '../updater'
import { getNextEvent, Event } from '../events'
import { TextChannel } from 'discord.js'
import { getTimezones } from '../settings'

async function updateEventMessage (client: Client, eventChannel: TextChannel, event: Event) {
  const messages = await eventChannel.messages.fetch({ limit: 10 })
  const displayMessage = messages.find(m => m.author.bot)
  if (!displayMessage) {
    updateDisplayedEvent(client, eventChannel.guild.id, true, false)
    return
  }

  // If the display message already has an embed, make sure it's for this event
  if (displayMessage.embeds && displayMessage.embeds.length >= 1) {
    const embed = displayMessage.embeds[0]
    const trimmedTitle = event.title.trim()
    const trimmedDesc = event.description.trim()
    if (embed.title !== trimmedTitle || embed.description !== trimmedDesc) {
      updateDisplayedEvent(client, eventChannel.guild.id, true, false)
      return
    }
  }

  // Get list of timezones for this channel
  const timezones = getTimezones(client.serverSettings, eventChannel.guild.id)

  // Complete events when applicable
  if (Date.now() > event.time.toMillis()) {
    const reaction = displayMessage.reactions.cache.get('🔔')
    if (reaction) {
      const users = await reaction.users.fetch()
      const pingString = users.filter(u => !u.bot).reduce((acc, val) => acc + val.toString() + ' ', '')

      const channel = eventChannel.guild.channels.cache.find(c => c.name === 'general') as TextChannel
      if (channel) {
        channel.send(`Event **${event.title}** is now starting\n${pingString}`)
      }

      event.attendees = users.filter(u => !u.bot).size
    }

    event.completeEvent(event.attendees)
    displayMessage.edit('', event.generateEventEmbed(timezones))
  } else {
    displayMessage.edit('', event.generateEventEmbed(timezones))

    // Add a bell icon if one doesn't exist
    if (!displayMessage.reactions.cache.get('🔔')) {
      await displayMessage.react('🔔')
    }
  }
}

export async function updateDisplayedEvent (client: Client, guildId: string, sendNew: boolean = false, ignoreTime: boolean = false) {
  const upcomingEvent = getNextEvent(client.eventsData, guildId)
  if (!upcomingEvent) return
  if (!ignoreTime && Date.now() + (24 * 3600 * 1000) < upcomingEvent.time.toMillis()) return

  const eventChannelId = client.serverSettings.get(guildId).channels.event
  const guild = client.guilds.cache.get(guildId)
  const eventChannel = guild.channels.cache.get(eventChannelId) as TextChannel

  if (sendNew) {
    const msg = await eventChannel.send('[Next Event]')
    msg.react('🔔')
  }
  updateEventMessage(client, eventChannel, upcomingEvent)
}

export default {
  description: 'Handle updating the displayed events',
  frequency: 2,

  async execute (client: Client) {
    client.guildsWithEvents.forEach(guild => updateDisplayedEvent(client, guild))
  }
}

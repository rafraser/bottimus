import { Client, Message } from '../command'
import { updateDisplayedEvent } from '../updaters/events'
import { getNextEvent } from '../events'
import { MessageReaction, User } from 'discord.js'
import { getTimezones } from '../settings'

export default {
  name: 'forceevent',
  description: '🛡️ Force the next event to display immediately',

  async execute (client: Client, message: Message, args: string[]) {
    if (!client.isAdministrator(message.member)) {
      message.channel.send('You need to be an Administrator to use this!')
      return
    }

    const upcomingEvent = getNextEvent(client.eventsData, message.guild)
    if (!upcomingEvent) {
      message.channel.send('No events are currently scheduled.')
      return
    }

    if (upcomingEvent.forced || Date.now() + (24 * 3600 * 1000) > upcomingEvent.time.toMillis()) {
      message.channel.send('The next event is already displayed!')
      return
    }

    const timezones = getTimezones(client.serverSettings, message.guild.id)
    const embed = upcomingEvent.generateEventEmbed(timezones)
    const msg = await message.channel.send(embed)

    const filter = (reaction: MessageReaction, user: User) => {
      return user.id === message.member.id && (reaction.emoji.name === '✅')
    }

    const collector = msg.createReactionCollector(filter, { time: 25000 })
    collector.on('collect', async r => {
      collector.stop()
      upcomingEvent.forceEvent()
      await updateDisplayedEvent(client, message.guild.id, false)
    })

    await msg.react('✅')
  }
}

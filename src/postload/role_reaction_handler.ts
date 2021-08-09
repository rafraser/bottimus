import BottimusClient from '../client'
import { requestRoles } from '../commands/role'
import { Message, TextChannel, Guild, GuildEmoji, User } from 'discord.js'

export default async function reactionHandler (client: BottimusClient) {
  // if (process.env.TESTING_CHANNEL) return

  // Find guilds which have roles which have reaction_messages attached
  Array.from(client.serverSettings).flatMap(([guild, settings]) => {
    if (!settings.roles) return []
    if (!settings.roles.choices) return []

    return settings.roles.choices
      .filter(choice => choice.reactionMessage)
      .map((choice) => { return { guild: guild, choice: choice } })
  }).forEach(async (details) => {
    await setupReactionListener(client, details.guild, details.choice)
  })
}

async function setupReactionListener (client: BottimusClient, guildId: string, choice: any) {
  const guild = client.guilds.cache.get(guildId)
  const message = await fetchOrSendListenMessage(client, guild, choice)

  // Add reactions to the message if they don't already exist
  Object.entries(choice.reactionEmotes).forEach(([emote, _]) => {
    const emoteKey = emote as string
    if (emoteKey.length > 4) {
      message.react(client.emojis.cache.get(emoteKey))
    } else {
      message.react(emoteKey)
    }
  })

  // Add a reaction handler
  client.on('messageReactionAdd', async (reaction, user) => {
    if (user.id === client.user.id) return
    if (reaction.message.id !== message.id) return

    const member = guild.members.cache.get(user.id)
    if (!member) return

    let reactionId
    if (reaction.emoji instanceof GuildEmoji) {
      reactionId = reaction.emoji.id
    } else {
      reactionId = reaction.emoji.name
    }

    const role = choice.reactionEmotes[reactionId]
    await requestRoles([choice], member, [role])
    await reaction.users.remove(user as User)
  })
}

async function fetchOrSendListenMessage (
  client: BottimusClient,
  guild: Guild,
  choice: any
): Promise<Message> {
  const channel = guild.channels.cache.get(choice.reactionMessage.channel) as TextChannel

  try {
    const message = await channel.messages.fetch(choice.reactionMessage.message)
    if (message.author.id === client.user.id) {
      message.edit(choice.reactionMessage.text)
    }
    return message
  } catch (err) {
    return await channel.send(choice.reactionMessage.text)
  }
}

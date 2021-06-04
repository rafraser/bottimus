import { Message, MessageEmbed, MessageReaction, User } from 'discord.js'

export async function sendPaginatedEmbed (
  message: Message,
  pages: MessageEmbed[],
  time = 60000,
  pageEmojis = ['⏪', '⏩'],
  allowOthers = false
) {
  let currentPage = 0
  const creatorId = message.member.id
  const embedMessage = await message.channel.send(pages[currentPage])
  if (pages.length <= 1) {
    // No need for fancy pagination with only one page
    return
  }

  // Add page buttons & setup reaction listeners
  await embedMessage.react(pageEmojis[0])
  await embedMessage.react(pageEmojis[1])
  const reactionCollector = embedMessage.createReactionCollector(
    (reaction, user) => {
      console.log(user.id, creatorId)
      return pageEmojis.includes(reaction.emoji.name) && !user.bot && (allowOthers || user.id === creatorId)
    }, { time: time }
  )

  // Handle reaction clicks
  reactionCollector.on('collect', async (reaction: MessageReaction, user: User) => {
    await reaction.users.remove(user)

    switch (reaction.emoji.name) {
      case pageEmojis[0]:
        currentPage = currentPage > 0 ? --currentPage : pages.length - 1
        break

      case pageEmojis[1]:
        currentPage = currentPage + 1 < pages.length ? ++currentPage : 0
        break

      default:
        break
    }

    await embedMessage.edit(pages[currentPage])
  })

  // Remove page buttons when the time is up
  reactionCollector.on('end', () => {
    if (embedMessage.deleted) return

    embedMessage.reactions.removeAll()
  })

  return embedMessage
}

export async function sendTabbedEmbed (
  message: Message,
  pages: Record<string, MessageEmbed>,
  time = 60000,
  allowOthers = false
) {
  const pageEmojis = Object.keys(pages)
  const creatorId = message.member.id
  const embedMessage = await message.channel.send(pages[pageEmojis[0]])

  // Add page buttons & setup reaction listeners
  for (const emoji of pageEmojis) {
    await embedMessage.react(emoji)
  }
  const reactionCollector = embedMessage.createReactionCollector(
    (reaction, user) => {
      return pageEmojis.includes(reaction.emoji.name) && !user.bot && (allowOthers || user.id === creatorId)
    }, { time: time }
  )

  // Handle reaction clicks
  reactionCollector.on('collect', async (reaction: MessageReaction, user: User) => {
    await reaction.users.remove(user)

    if (pages[reaction.emoji.name]) {
      await embedMessage.edit(pages[reaction.emoji.name])
    }
  })

  // Remove page buttons when the time is up
  reactionCollector.on('end', () => {
    if (embedMessage.deleted) return

    embedMessage.reactions.removeAll()
  })

  return embedMessage
}

export async function sendLazyTabbedEmbed (
  message: Message,
  pages: Record<string, Promise<MessageEmbed>>,
  time = 60000,
  allowOthers = false
) {
  const pageEmojis = Object.keys(pages)
  const creatorId = message.member.id
  const initialContent = await pages[pageEmojis[0]]
  const embedMessage = await message.channel.send(initialContent)

  // Add page buttons & setup reaction listeners
  for (const emoji of pageEmojis) {
    await embedMessage.react(emoji)
  }
  const reactionCollector = embedMessage.createReactionCollector(
    (reaction, user) => {
      return pageEmojis.includes(reaction.emoji.name) && !user.bot && (allowOthers || user.id === creatorId)
    }, { time: time }
  )

  // Handle reaction clicks
  reactionCollector.on('collect', async (reaction: MessageReaction, user: User) => {
    await reaction.users.remove(user)

    if (pages[reaction.emoji.name]) {
      const messageContent = await pages[reaction.emoji.name]
      await embedMessage.edit(messageContent)
    }
  })

  // Remove page buttons when the time is up
  reactionCollector.on('end', () => {
    if (embedMessage.deleted) return

    embedMessage.reactions.removeAll()
  })

  return embedMessage
}

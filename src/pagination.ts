import { Message, MessageActionRow, MessageEmbed, MessageReaction, MessageSelectMenu, User } from 'discord.js'

export async function sendPaginatedEmbed (
  message: Message,
  pages: MessageEmbed[],
  time = 60000,
  pageEmojis = ['⏪', '⏩'],
  allowOthers = false
) {
  let currentPage = 0
  const creatorId = message.member.id
  const embedMessage = await message.channel.send({ embeds: [pages[currentPage]] })
  if (pages.length <= 1) {
    // No need for fancy pagination with only one page
    return
  }

  // Add page buttons & setup reaction listeners
  await embedMessage.react(pageEmojis[0])
  await embedMessage.react(pageEmojis[1])

  const reactionCollector = embedMessage.createReactionCollector({
    filter: (reaction, user) => {
      return pageEmojis.includes(reaction.emoji.name) && !user.bot && (allowOthers || user.id === creatorId)
    },
    time
  })

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

    await embedMessage.edit({ embeds: [pages[currentPage]] })
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
  const embedMessage = await message.channel.send({ embeds: [pages[pageEmojis[0]]] })

  // Add page buttons & setup reaction listeners
  for (const emoji of pageEmojis) {
    await embedMessage.react(emoji)
  }
  const reactionCollector = embedMessage.createReactionCollector({
    filter: (reaction, user) => {
      return pageEmojis.includes(reaction.emoji.name) && !user.bot && (allowOthers || user.id === creatorId)
    },
    time
  })

  // Handle reaction clicks
  reactionCollector.on('collect', async (reaction: MessageReaction, user: User) => {
    await reaction.users.remove(user)

    if (pages[reaction.emoji.name]) {
      await embedMessage.edit({ embeds: [pages[reaction.emoji.name]] })
    }
  })

  // Remove page buttons when the time is up
  reactionCollector.on('end', () => {
    if (embedMessage.deleted) return

    embedMessage.reactions.removeAll()
  })

  return embedMessage
}

export interface SelectPage {
  label: string
  embed: Promise<MessageEmbed>
  emoji?: string
  description?: string
}

export async function sendLazySelectEmbed (
  message: Message,
  pages: Record<string, SelectPage>,
  placeholder = 'Select a category',
  time = 60000,
  allowOthers = false
) {
  const pageKeys = Object.keys(pages)
  const creatorId = message.member.id

  const buildRow = (disabled = false) => new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId('select-page')
      .setPlaceholder(placeholder)
      .setDisabled(disabled)
      .addOptions(pageKeys.map(key => ({
        label: pages[key].label,
        value: key,
        emoji: pages[key].emoji,
        description: pages[key].description
      })))
  )

  const initialContent = await pages[pageKeys[0]].embed
  const embedMessage = await message.channel.send({ embeds: [initialContent], components: [buildRow()] })

  const collector = embedMessage.createMessageComponentCollector({ componentType: 'SELECT_MENU', time })

  // Handle selections
  collector.on('collect', async (i) => {
    if (!allowOthers && i.user.id !== creatorId) {
      await i.deferUpdate()
      return
    }

    const key = i.values[0]
    if (pages[key]) {
      const messageContent = await pages[key].embed
      await i.update({ embeds: [messageContent], components: [buildRow()] })
    } else {
      await i.deferUpdate()
    }
  })

  // Disable the dropdown when the time is up
  collector.on('end', async () => {
    if (embedMessage.deleted) return

    await embedMessage.edit({ components: [buildRow(true)] })
  })

  return embedMessage
}

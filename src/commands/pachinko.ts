import { Client, Message } from '../command'
import { getArcadeCredits, incrementArcadeCredits } from '../arcade'
import { queryHelper } from '../database'
import { ButtonInteraction, GuildMember, MessageActionRow, MessageAttachment, MessageButton, MessageEditOptions, MessageEmbed, MessageOptions } from 'discord.js'

const BALL_COST = 250
const MAX_BALLS_PER_USER = 5
const NUM_SLOTS = 5
const COLLECT_TIME = 30000
const REVEAL_DELAY = 12500

type Bin = { size: number, value: number, color: string }
type BoardInfo = { seed: number, layout: string, bins: Bin[] }
type PlayResult = { seed: number, layout: string, balls: { column: number, value: number }[] }
type BallEntry = { member: GuildMember, column: number }

function updatePachinkoStat (id: string, balls: number, winnings: number) {
  const queryString = 'INSERT INTO arcade_pachinko VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE number = number + VALUES(number), winnings = winnings + VALUES(winnings)'
  return queryHelper(queryString, [id, balls, winnings])
}

/* Python bridge - GIF generation and physics is handled in Python */
async function previewBoard (client: Client, seed: number, outPath: string): Promise<BoardInfo> {
  const raw = await client.executePython('pachinko', ['--preview', '--seed', String(seed), '--out', outPath], true)
  return JSON.parse(raw)
}

async function playBoard (client: Client, seed: number, balls: BallEntry[], outPath: string): Promise<PlayResult> {
  const args = [
    '--seed', String(seed),
    '--out', outPath,
    '--column', ...balls.map(b => String(b.column + 1)),
    '--colors', ...balls.map(b => b.member.displayHexColor || '#95a5a6'),
    '--initials', ...balls.map(b => b.member.displayName.charAt(0).toUpperCase())
  ]

  const raw = await client.executePython('pachinko', args, true)
  return JSON.parse(raw)
}

/* Embed stuff */
function buildBinRow (bins: Bin[]): string {
  const row = bins.map(b => String(b.value).padStart(5)).join(' | ')
  return '```\n' + row + '\n```'
}

function buildSlotButtons (active: boolean): MessageActionRow {
  const row = new MessageActionRow()
  for (let i = 0; i < NUM_SLOTS; i++) {
    row.addComponents(
      new MessageButton()
        .setCustomId(`slot:${i}`)
        .setLabel(String(i + 1))
        .setStyle('PRIMARY')
        .setDisabled(!active)
    )
  }
  return row
}

function formatParticipants (balls: BallEntry[]): string {
  if (balls.length === 0) return 'No balls dropped yet - be the first!'

  const perUser = new Map<string, { member: GuildMember, count: number }>()
  balls.forEach(b => {
    const existing = perUser.get(b.member.id)
    if (existing) {
      existing.count++
    } else {
      perUser.set(b.member.id, { member: b.member, count: 1 })
    }
  })

  return [...perUser.values()]
    .map(({ member, count }) => `**${member.displayName}**: ${count} ball${count > 1 ? 's' : ''}`)
    .join('\n')
}

function buildLobbyEmbed (board: BoardInfo, balls: BallEntry[], endsAt: number, imageName: string): MessageOptions {
  const embed = new MessageEmbed()
    .setColor('#70a1ff')
    .setTitle('🎰 Pachinko!')
    .setDescription(`Game drops <t:${Math.floor(endsAt / 1000)}:R>`)
    .addField('Players', formatParticipants(balls))
    .setFooter({ text: `Entry: ${BALL_COST} coins/ball` })
    .setImage(`attachment://${imageName}`)

  return { embeds: [embed], components: [buildSlotButtons(true)] }
}

function buildCancelledEmbed (): MessageEditOptions {
  return {
    embeds: [new MessageEmbed().setColor('#70a1ff').setTitle('🎰 Pachinko!').setDescription('No one played - game cancelled.')],
    components: [],
    attachments: []
  }
}

function buildDroppingEmbed (): MessageEditOptions {
  return {
    embeds: [new MessageEmbed().setColor('#70a1ff').setTitle('🎰 Pachinko!').setDescription('🎱 Balls are dropping...')],
    components: [],
    attachments: []
  }
}

function buildResultEmbed (balls: BallEntry[], result: PlayResult): MessageOptions {
  const perUser = new Map<string, { member: GuildMember, values: number[] }>()
  balls.forEach((b, i) => {
    const value = result.balls[i].value
    const existing = perUser.get(b.member.id)
    if (existing) {
      existing.values.push(value)
    } else {
      perUser.set(b.member.id, { member: b.member, values: [value] })
    }
  })

  const lines = [...perUser.values()].map(({ member, values }) => {
    const total = values.reduce((a, v) => a + v, 0)
    return `**${member.displayName}**: ${values.join(' + ')} = **${total}** coins`
  })

  const embed = new MessageEmbed()
    .setColor('#70a1ff')
    .setTitle('🎰 Pachinko results!')
    .setDescription(lines.join('\n'))

  return { embeds: [embed] }
}

async function handleSlotClick (i: ButtonInteraction, gameMsg: Message, board: BoardInfo, previewName: string, endsAt: number, balls: BallEntry[], userBallCounts: Map<string, number>) {
  const member = i.member as GuildMember
  const slot = parseInt(i.customId.split(':')[1])

  if ((userBallCounts.get(member.id) || 0) >= MAX_BALLS_PER_USER) {
    await i.reply({ content: `You've already dropped the max of ${MAX_BALLS_PER_USER} balls!`, ephemeral: true })
    return
  }

  const userCredits = await getArcadeCredits(member.id)
  if (userCredits < BALL_COST) {
    await i.reply({ content: `You need at least ${BALL_COST} coins for another ball!`, ephemeral: true })
    return
  }

  incrementArcadeCredits(member.id, -BALL_COST)
  balls.push({ member, column: slot })
  userBallCounts.set(member.id, (userBallCounts.get(member.id) || 0) + 1)

  await i.deferUpdate()
  await gameMsg.edit(buildLobbyEmbed(board, balls, endsAt, previewName) as MessageEditOptions)
}

async function dropBalls (client: Client, message: Message, gameMsg: Message, seed: number, balls: BallEntry[]) {
  await gameMsg.edit(buildDroppingEmbed())

  const imageName = `pachinko_${seed}.gif`
  const outPath = `img/${imageName}`
  let result: PlayResult
  try {
    result = await playBoard(client, seed, balls, outPath)
  } catch (err) {
    message.channel.send('Something went wrong dropping the balls.')
    return
  }

  const perUserStats = new Map<string, { balls: number, winnings: number }>()
  balls.forEach((b, i) => {
    const value = result.balls[i].value
    if (value > 0) incrementArcadeCredits(b.member.id, value)

    const existing = perUserStats.get(b.member.id)
    if (existing) {
      existing.balls++
      existing.winnings += value
    } else {
      perUserStats.set(b.member.id, { balls: 1, winnings: value })
    }
  })
  perUserStats.forEach((stats, id) => updatePachinkoStat(id, stats.balls, stats.winnings))

  const attachment = new MessageAttachment(outPath, imageName)
  await message.channel.send({ files: [attachment] })

  setTimeout(() => {
    message.channel.send(buildResultEmbed(balls, result))
  }, REVEAL_DELAY)
}

async function runLobby (client: Client, message: Message, seed: number, board: BoardInfo, previewPath: string, previewName: string) {
  const balls: BallEntry[] = []
  const userBallCounts = new Map<string, number>()
  const endsAt = Date.now() + COLLECT_TIME

  const previewAttachment = new MessageAttachment(previewPath, previewName)
  const gameMsg = await message.channel.send({ ...buildLobbyEmbed(board, balls, endsAt, previewName), files: [previewAttachment] })
  const collector = gameMsg.createMessageComponentCollector({ componentType: 'BUTTON', time: COLLECT_TIME })

  collector.on('collect', async i => {
    await handleSlotClick(i, gameMsg, board, previewName, endsAt, balls, userBallCounts)
  })

  collector.on('end', async () => {
    if (balls.length === 0) {
      await gameMsg.edit(buildCancelledEmbed())
      return
    }

    await dropBalls(client, message, gameMsg, seed, balls)
  })
}

export default {
  name: 'pachinko',
  description: `Multiplayer gambling! Drop balls down the board for a chance to win big.`,
  cooldown: 120,

  async execute (client: Client, message: Message, args: string[]) {
    const credits = await getArcadeCredits(message.member.id)
    if (credits < BALL_COST) {
      message.channel.send(`You need at least ${BALL_COST} coins to play!`)
      return
    }

    client.updateCooldown(this, message.member.id)

    const seed = Math.floor(Math.random() * (2 ** 32))
    const previewName = `pachinko_${seed}_preview.png`
    const previewPath = `img/${previewName}`

    let board: BoardInfo
    try {
      board = await previewBoard(client, seed, previewPath)
    } catch (err) {
      message.channel.send('Something went wrong setting up the board - please try again.')
      return
    }

    await runLobby(client, message, seed, board, previewPath, previewName)
  }
}

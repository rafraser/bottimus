import { Client, Message } from '../command'
import { ColorResolvable, GuildMember, MessageActionRow, MessageButton, MessageEditOptions, MessageEmbed, MessageOptions } from 'discord.js'
import { getArcadeCredits, incrementArcadeCredits } from '../arcade'
import { queryHelper } from '../database'

const HIDDEN_EMOJI = '\u26CF\uFE0F'
const BOMB_EMOJI = '\uD83D\uDCA3'

const TILES = [
  { type: 'coin', value: 20, emoji: '🪙' },
  { type: 'bag', value: 150, emoji: '💰' },
  { type: 'diamond', value: 500, emoji: '💎' }
] as const

type TileDefinition = typeof TILES[number]

type Difficulty = {
  mines: number
  weights: number[] // matches the order of TILES above
  color: ColorResolvable
}

const DIFFICULTIES: Record<string, Difficulty> = {
  easy: { mines: 2, weights: [0.65, 0.25, 0.10], color: '#4cd137' },
  medium: { mines: 4, weights: [0.40, 0.35, 0.25], color: '#e1b12c' },
  hard: { mines: 6, weights: [0.25, 0.35, 0.40], color: '#c0392b' }
}

// TODO: make this type better when strictNullChecks is enabled
type Cell = {
  isMine: boolean
  tile?: TileDefinition
  revealed: boolean
  clicked: boolean
}

const ENTRY_COST = 200
const GRID_SIZE = 16
const CLEAR_BONUS_MULTIPLIER = 0.5

function updateBombsStat (userid: string, difficulty: string, winnings: number) {
  const queryString = 'INSERT INTO arcade_bombs VALUES(?, ?, 1, ?, ?) ON DUPLICATE KEY UPDATE number = number + 1, winnings = winnings + VALUES(winnings), bet_total = bet_total + VALUES(bet_total);'
  return queryHelper(queryString, [userid, difficulty, winnings, ENTRY_COST])
}

function weightedTile (weights: number[]): TileDefinition {
  let r = Math.random()
  for (let i = 0; i < TILES.length; i++) {
    if (r < weights[i]) return TILES[i]
    r -= weights[i]
  }
  return TILES[TILES.length - 1]
}

// 4x4 board; mines + prize weights depends on difficulty
function generateBoard (difficulty: Difficulty): Cell[] {
  const cells: Cell[] = Array.from({ length: GRID_SIZE }, () => ({ isMine: false, revealed: false, clicked: false }))

  const minePositions = new Set<number>()
  while (minePositions.size < difficulty.mines) {
    minePositions.add(Math.floor(Math.random() * GRID_SIZE))
  }
  minePositions.forEach(i => { cells[i].isMine = true })

  cells.forEach(cell => {
    if (!cell.isMine) cell.tile = weightedTile(difficulty.weights)
  })

  return cells
}

// Every state uses an "emoji XXX"-shaped label so buttons stay a consistent
// size as tiles get revealed, rather than relying on invisible padding
function buildTileButton (idx: number, cell: Cell, active: boolean) {
  const button = new MessageButton().setCustomId(`tile:${idx}`)

  if (cell.revealed) {
    // Cells the player never actually clicked (revealed as part of the
    // end-of-game grid dump) are greyed out rather than colored, so it's
    // clear at a glance which tiles were actually part of the game
    if (cell.isMine) {
      button.setLabel(`${BOMB_EMOJI} XXX`).setStyle(cell.clicked ? 'DANGER' : 'SECONDARY')
    } else {
      button.setLabel(`${cell.tile.emoji} ${String(cell.tile.value).padStart(3, '0')}`).setStyle(cell.clicked ? 'SUCCESS' : 'SECONDARY')
    }
    button.setDisabled(true)
  } else {
    button.setLabel(`${HIDDEN_EMOJI} ???`).setStyle('SECONDARY').setDisabled(!active)
  }

  return button
}

function buildBombsMessage (member: GuildMember, difficultyName: string, difficulty: Difficulty, cells: Cell[], total: number, active: boolean, showDifficultyTip: boolean, lost: boolean = false): MessageOptions {
  const label = difficultyName[0].toUpperCase() + difficultyName.slice(1)
  let footer = `Difficulty: ${label} | Entry: ${ENTRY_COST} coins`
  if (showDifficultyTip) footer += '\nTip: try !bombs medium or !bombs hard for bigger risks and rewards!'

  const embed = new MessageEmbed()
    .setTitle(`${member.displayName}'s Bombs`)
    .setColor(difficulty.color)
    .setFooter({ text: footer })

  if (active) {
    embed.setDescription(`Click a tile to reveal it, or cash out to bank your winnings!\n\n**Current winnings: ${total} coins**`)
  } else if (lost) {
    embed.setDescription(`This game has ended.\n\n~~${total} coins~~`)
  } else {
    embed.setDescription(`This game has ended.\n\n**Final winnings: ${total} coins**`)
  }

  // i love for loops
  const rows: MessageActionRow[] = []
  for (let r = 0; r < 4; r++) {
    const row = new MessageActionRow()
    for (let c = 0; c < 4; c++) {
      const idx = r * 4 + c
      row.addComponents(buildTileButton(idx, cells[idx], active))
    }
    rows.push(row)
  }

  rows.push(new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId('cashout')
      .setLabel(active ? `💵 Cash Out (${total})` : '💵 Cash Out')
      .setStyle('PRIMARY')
      .setDisabled(!active || total <= 0)
  ))

  return { embeds: [embed], components: rows }
}

async function playBombs (client: Client, message: Message, member: GuildMember, difficultyName: string, difficulty: Difficulty, wasDefaulted: boolean) {
  const coin = client.getCoinEmoji()
  const cells = generateBoard(difficulty)
  const safeTotal = GRID_SIZE - difficulty.mines
  let total = 0
  let revealedSafe = 0
  let finished = false

  const gameMsg = await message.channel.send(buildBombsMessage(member, difficultyName, difficulty, cells, total, true, wasDefaulted))
  const collector = gameMsg.createMessageComponentCollector({ componentType: 'BUTTON', idle: 30000, time: 300000 })

  // Finish the game -> award prizes + make sure to track stats
  const finish = async (banked: boolean, cleared: boolean = false) => {
    if (finished) return
    finished = true
    collector.stop()

    if (cleared) {
      total += Math.round(total * CLEAR_BONUS_MULTIPLIER)
    }

    cells.forEach(cell => { cell.revealed = true })
    await gameMsg.edit(buildBombsMessage(member, difficultyName, difficulty, cells, total, false, wasDefaulted, !banked) as MessageEditOptions)

    updateBombsStat(member.id, difficultyName, total)

    if (cleared) {
      incrementArcadeCredits(member.id, total)
      await message.channel.send(`Congrats, ${member.displayName}! You cleared the board and won ${coin} **${total}**`)
    } else if (banked && total > 0) {
      incrementArcadeCredits(member.id, total)
      await message.channel.send(`Congrats, ${member.displayName}! You won ${coin} **${total}**`)
    } else {
      await message.channel.send(`Better luck next time, ${member.displayName} :(`)
    }
  }

  // handle button clicks
  collector.on('collect', async i => {
    if (i.user.id !== member.id) {
      await i.reply({ content: 'This isn\'t your game!', ephemeral: true })
      return
    }
    if (finished) {
      await i.deferUpdate()
      return
    }

    if (i.customId === 'cashout') {
      await i.deferUpdate()
      await finish(true)
      return
    }

    const idx = parseInt(i.customId.split(':')[1])
    const cell = cells[idx]
    if (!cell || cell.revealed) {
      await i.deferUpdate()
      return
    }

    cell.revealed = true
    cell.clicked = true
    await i.deferUpdate()

    if (cell.isMine) {
      await finish(false)
      return
    }

    total += cell.tile.value
    revealedSafe++

    if (revealedSafe === safeTotal) {
      await finish(true, true)
      return
    }

    await gameMsg.edit(buildBombsMessage(member, difficultyName, difficulty, cells, total, true, wasDefaulted) as MessageEditOptions)
  })

  // Auto complete if someone forgets to hit cash out
  collector.on('end', async () => {
    await finish(true)
  })
}

export default {
  name: 'bombs',
  description: `Push your luck, collecting prizes. Cash out at any time, but hit a bomb and lose it all.`,
  aliases: ['mines', 'minesweeper'],
  cooldown: 90,

  async execute (client: Client, message: Message, args: string[]) {
    const wasDefaulted = !args[0]
    const difficultyName = (args[0] || 'easy').toLowerCase()
    const difficulty = DIFFICULTIES[difficultyName]
    if (!difficulty) {
      message.channel.send('Please pick a difficulty: `easy`, `medium`, or `hard`')
      return
    }

    const credits = await getArcadeCredits(message.member.id)
    if (credits < ENTRY_COST) {
      message.channel.send(`You need at least **${ENTRY_COST}** coins for this!`)
      return
    }

    client.updateCooldown(this, message.member.id)
    incrementArcadeCredits(message.member.id, -ENTRY_COST)

    await playBombs(client, message, message.member, difficultyName, difficulty, wasDefaulted)
  }
}

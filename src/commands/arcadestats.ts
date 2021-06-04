import { Client, Message } from '../command'
import { GuildMember, MessageEmbed } from 'discord.js'
import { queryHelper } from '../database'
import { sendLazyTabbedEmbed } from '../pagination'

// Calculate the totals across all trivia categories
function calculateTriviaTotals (results: any[]) {
  let totalGuesses = 0
  let totalCorrect = 0

  for (const result of results) {
    totalGuesses = totalGuesses + result.attempted
    totalCorrect = totalCorrect + result.correct
  }

  return [totalGuesses, totalCorrect]
}
// Retrieve Hangman statistics for a given ID from the database
function fetchHangmanStatistics (id: string): Promise<any[]> {
  return queryHelper('SELECT guesses, correct, revealed, words, contribution, (correct/guesses) AS percent FROM arcade_hangman WHERE discordid = ?;', [id])
}

// Retrieve Trivia statistics for a given ID from the database
function fetchTriviaStatistics (id: string): Promise<any[]> {
  return queryHelper('SELECT category, attempted, correct, (correct/attempted) AS percent FROM arcade_trivia WHERE discordid = ? ORDER BY (correct/attempted) DESC;', [id])
}

// Retrieve Typeracer statistics for a given ID from the database
function fetchTyperacerStatistics (id: string): Promise<any[]> {
  return queryHelper('SELECT completed, speed_average, speed_best, date_best FROM arcade_typeracer WHERE discordid = ?;', [id])
}

// Retrieve Scratchcard statistics for a given ID from the database
function fetchScratchcardStatistics (id: string): Promise<any[]> {
  return queryHelper('SELECT number, winnings, ROUND(winnings/number, 2) AS average FROM arcade_scratchcard WHERE discordid = ?;', [id])
}

// Retrieve Mining statistics for a given ID from the database
function fetchMiningStatistics (id: string): Promise<any[]> {
  return queryHelper('SELECT number, diamonds, FLOOR(diamonds/number) AS average FROM arcade_mining WHERE discordid = ?;', [id])
}

// Retrieve Prize statistics for a given ID from the database
function fetchPrizeStatistics (id: string): Promise<any[]> {
  return queryHelper('SELECT SUM(amount) AS total, COUNT(amount) AS collected FROM arcade_prizes WHERE discordid = ?;', [id])
}

// Retrieve Roulette statistics for a given ID from the database
function fetchRouletteStatistics (id: string): Promise<any[]> {
  return queryHelper('SELECT number, winnings, ROUND(winnings/number, 2) AS payout_average, ROUND(bet_total/number, 2) AS bet_average, bet_total FROM arcade_roulette WHERE discordid = ?;', [id])
}

// Keep the embed functions in an object for modular lookup
type embedFunction = Record<string, (user: GuildMember) => Promise<MessageEmbed>>
const embedFunctions = {} as embedFunction

// Generate a nice embed for Hangman information
embedFunctions.hangman = async function (user: GuildMember) {
  const results = await fetchHangmanStatistics(user.id)
  const username = user.displayName
  const r = results[0]

  if (!r) {
    return new MessageEmbed()
      .setColor('#4cd137')
      .setTitle(`🚷 Hangman -  ${username}`)
      .setDescription('No data found.')
  } else {
    return new MessageEmbed()
      .setColor('#4cd137')
      .setTitle(`🚷 Hangman -  ${username}`)
      .addField('Letters Guessed', `${r.guesses}`, true)
      .addField('Letters Correct', `${r.correct}`, true)
      .addField('Percentage', `${Math.floor(r.percent * 100) || 0}%`, true)
      .addField('Revealed', `${r.revealed}`, true)
      .addField('Words Contributed', `${r.words}`, true)
      .addField('Contribution', `${r.contribution}%`, true)
  }
}

// Generate a nice embed for Trivia information
embedFunctions.trivia = async function (user: GuildMember): Promise<MessageEmbed> {
  const results = await fetchTriviaStatistics(user.id)
  const username = user.displayName

  if (!results || results.length < 1) {
    return new MessageEmbed()
      .setColor('#4cd137')
      .setTitle(`❓ Trivia - ${username}`)
      .setDescription('No data found.')
  } else {
    const [totalGuesses, totalCorrect] = calculateTriviaTotals(results)

    return new MessageEmbed()
      .setColor('#4cd137')
      .setTitle(`❓ Trivia - ${username}`)
      .addField('Questions Answered', `${totalGuesses}`, true)
      .addField('Questions Correct', `${totalCorrect}`, true)
      .addField('Percentage', `${Math.floor((totalCorrect / totalGuesses) * 100) || 0}%`, true)
  }
}

// Generate a nice embed for Typeracer information
embedFunctions.typeracer = async function (user: GuildMember): Promise<MessageEmbed> {
  const results = await fetchTyperacerStatistics(user.id)
  const r = results[0]
  const username = user.displayName

  if (!r) {
    return new MessageEmbed()
      .setColor('#4cd137')
      .setTitle(`🏎 Type Racer - ${username}`)
      .setDescription('No data found.')
  } else {
    // Format the date nicely
    // Who knew this would be the worst part of all this
    const d = r.date_best
    const day = (d.getDate()).toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = d.getFullYear().toString()
    const best = day + '-' + month + '-' + year

    return new MessageEmbed()
      .setColor('#4cd137')
      .setTitle(`🏎 Type Racer - ${username}`)
      .addField('Races Completed', `${r.completed}`, true)
      .addField('Average Speed', `${r.speed_average}WPM`, true)
      .addField('Best Speed', `${r.speed_best}WPM`, true)
      .addField('Record Date', `${best}`, true)
  }
}

// Generate a nice embed for Scratchcard information
embedFunctions.scratchcard = async function (user: GuildMember): Promise<MessageEmbed> {
  const results = await fetchScratchcardStatistics(user.id)
  const r = results[0]
  const username = user.displayName

  if (!r) {
    return new MessageEmbed()
      .setColor('#4cd137')
      .setTitle(`💸 Scratch Cards - ${username}`)
      .setDescription('No data found.')
  } else {
    return new MessageEmbed()
      .setColor('#4cd137')
      .setTitle(`💸 Scratch Cards - ${username}`)
      .addField('Number', `${r.number}`, true)
      .addField('Total Winnings', `${r.winnings}`, true)
      .addField('Profit', `${r.winnings - r.number * 250}`, true)
      .addField('Average Income', `${r.average}`, true)
  }
}
embedFunctions.scratch = embedFunctions.scratchcard

// Generate a nice embed for Mining information
embedFunctions.mining = async function (user: GuildMember): Promise<MessageEmbed> {
  const results = await fetchMiningStatistics(user.id)
  const r = results[0]
  const username = user.displayName

  if (!r) {
    return new MessageEmbed()
      .setColor('#4cd137')
      .setTitle(`⛏️ Mining - ${username}`)
      .setDescription('No data found.')
  } else {
    return new MessageEmbed()
      .setColor('#4cd137')
      .setTitle(`⛏️ Mining - ${username}`)
      .addField('Expeditions', `${r.number}`, true)
      .addField('Diamonds', `${r.diamonds}`, true)
      .addField('Average', `${r.average}`, true)
      .addField('Earnings', `${r.diamonds * 5}`, true)
      .addField('Profit', `${r.diamonds * 5 - r.number * 25}`, true)
  }
}

// Generate a nice embed for Prizes information
embedFunctions.prizes = async function (user: GuildMember): Promise<MessageEmbed> {
  const results = await fetchPrizeStatistics(user.id)
  const r = results[0]
  const username = user.displayName

  if (!r) {
    return new MessageEmbed()
      .setColor('#4cd137')
      .setTitle(`🔮 Prizes - ${username}`)
      .setDescription('No data found.')
  } else {
    return new MessageEmbed()
      .setColor('#4cd137')
      .setTitle(`🔮 Prizes - ${username}`)
      .addField('Total', `${r.total}`, true)
      .addField('Unique', `${r.collected}`, true)
  }
}

// Generate a nice embed for Roulette information
embedFunctions.roulette = async function (user: GuildMember): Promise<MessageEmbed> {
  const results = await fetchRouletteStatistics(user.id)
  const r = results[0]
  const username = user.displayName

  if (!r) {
    return new MessageEmbed()
      .setColor('#4cd137')
      .setTitle(`💰 Roulette - ${username}`)
      .setDescription('No data found.')
  } else {
    return new MessageEmbed()
      .setColor('#4cd137')
      .setTitle(`💰 Roulette - ${username}`)
      .addField('Number', `${r.number}`, true)
      .addField('Total Winnings', `${r.winnings}`, true)
      .addField('Total Bet', `${r.bet_total}`, true)
      .addField('Profit', `${r.winnings - r.bet_total}`, true)
      .addField('Average Income', `${r.payout_average}`, true)
      .addField('Average Bet', `${r.bet_average}`, true)
  }
}

// Generate a nice embed for a help page
embedFunctions.help = async function (user: GuildMember): Promise<MessageEmbed> {
  return new MessageEmbed()
    .setColor('#4cd137')
    .setTitle('ℹ️ Help')
    .setDescription('Select a tab to view statistics:')
    .addField('🚷', 'Hangman', true)
    .addField('⛏️', 'Mining', true)
    .addField('🔮', 'Prizes', true)
    .addField('💰', 'Roulette', true)
    .addField('💸', 'Scratchcards', true)
    .addField('❓', 'Trivia', true)
    .addField('🏎', 'Typeracer', true)
}

export default {
  name: 'arcadestats',
  description: 'Fetchs statistics for arcade games.\nFor a list of stat types:`!arcadestats`\nFor your statistics:`!arcadestats [type]`\nFor someone else\'s statistics:`!arcadestats [user] [type]`',
  aliases: ['gamestats', 'casinostats'],
  cooldown: 65,

  async execute (client: Client, message: Message, args: string[]) {
    const user = await client.findUser(message, args, true)

    const pages = {
      ℹ️: embedFunctions.help(user),
      '🚷': embedFunctions.hangman(user),
      '⛏️': embedFunctions.mining(user),
      '🔮': embedFunctions.prizes(user),
      '💰': embedFunctions.roulette(user),
      '💸': embedFunctions.scratchcard(user),
      '❓': embedFunctions.trivia(user),
      '🏎': embedFunctions.typeracer(user)
    }
    await sendLazyTabbedEmbed(message, pages)
  }
}

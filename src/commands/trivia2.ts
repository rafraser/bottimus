import { Client, Message } from '../command'
import { incrementArcadeCredits } from '../arcade'
import { queryHelper } from '../database'
import { GuildMember, MessageActionRow, MessageButton, MessageEmbed, MessageOptions } from 'discord.js'
import { AllHtmlEntities } from 'html-entities'
import fetch from 'node-fetch'
import { APIInteractionGuildMember } from 'discord-api-types'

type Question = {
  answers: string[]
  correct: number
  question: string
  category: string
  difficulty: string
}

type GuessMember = GuildMember|APIInteractionGuildMember

function memberName (member: GuessMember) {
  return member instanceof GuildMember ? member.displayName : member.user.username
}

const entities = new AllHtmlEntities()
const categories = {
  science: [17, 17, 17, 18, 19, 27, 28, 30],
  entertainment: [10, 11, 12, 13, 14, 15, 16, 29, 31, 32],
  humanities: [22, 22, 20, 23, 24, 25, 25, 26],
  general: [9]
} as { [category: string]: number[] }

/**
 * Given a category, return an ID to query OpenTDB with
 * @param category Name of the category group to lookup. If not found, will return a random category ID.
 * @returns ID for querying OpenTDB
 */
function getCategoryId (category: string): number {
  if (category in categories) {
    const ids = categories[category]
    return ids[Math.floor(Math.random() * ids.length)]
  } else {
    const keys = Object.keys(categories)
    return getCategoryId(keys[Math.floor(Math.random() * keys.length)])
  }
}

/**
 * Store Trivia results into the database
 * @param userid Player ID
 * @param category Category name
 * @param correct Whether the player got the question correct or not
 * @returns n/a
 */
async function incrementStatScore (client: Client, userid: string, category: string, correct: number) {
  const queryString = 'INSERT INTO arcade_trivia VALUES(?, ?, 1, ?) ON DUPLICATE KEY UPDATE attempted = attempted + 1, correct = correct + VALUES(correct);'
  return await queryHelper(queryString, [userid, category, correct])
}

/**
 *
 * @param category CategoryID to query - see getCategoryId above
 * @returns Question details
 */
async function getQuestionData (category: number): Promise<Question> {
  const resp = await fetch(`https://opentdb.com/api.php?amount=1&category=${category}&type=multiple`)
  const json = await resp.json()
  const info = json.results[0]

  const data = {} as any
  // Shuffle the correct answer into the other answers
  data.answers = info.incorrect_answers
  data.correct = Math.floor(Math.random() * Math.floor(4))
  data.answers.splice(data.correct, 0, info.correct_answer)

  data.question = entities.decode(info.question)
  data.answers = data.answers.map(entities.decode)
  data.category = info.category
  data.difficulty = info.difficulty.charAt(0).toUpperCase() + info.difficulty.slice(1)
  return data
}

function buildTriviaEmbed (question: Question, guesses: Map<GuessMember, number>, active: boolean): MessageOptions {
  const embed = new MessageEmbed()
    .setColor('#4cd137')
    .setTitle(question.category)
    .setDescription(question.question)
    .setFooter({ text: 'Difficulty: ' + question.difficulty })
  const row = new MessageActionRow().addComponents(buildButtons(question, active, question.correct))

  if (active) {
    const participants = [...guesses.keys()].map(memberName)
    embed.addField('Participants', participants.length >= 1 ? participants.join(', ') : 'No entries yet!')
  } else {
    guesses.forEach((guessIdx, member) => {
      const guessText = question.answers[guessIdx]
      const guessName = member instanceof GuildMember ? member.displayName : member.user.username
      embed.addField(guessName, guessText, true)
    })
  }

  return { embeds: [embed], components: [row] }
}

/**
 * Build a row of buttons for a trivia question
 * @param question
 * @returns
 */
function buildButtons (question: Question, active: boolean, correct: number) {
  return question.answers.map((value, idx) => {
    return new MessageButton()
      .setCustomId(idx.toString())
      .setLabel(value)
      .setStyle(idx === correct && !active ? 'SUCCESS' : 'PRIMARY')
      .setDisabled(!active)
  })
}

/**
 * Handle winners at the end of the game
 * This will announce the winners, as well as increments stats + arcade tokens as required
 * @param client
 * @param message
 * @param guesses
 * @param question
 */
async function checkWinners (client: Client, message: Message, guesses: Map<GuessMember, number>, question: Question) {
  const winners = [] as string[]
  guesses.forEach((guessIdx, member) => {
    const isWinner = guessIdx === question.correct
    incrementStatScore(client, member.user.id, question.category, isWinner ? 1 : 0)
    incrementArcadeCredits(member.user.id, isWinner ? 20 : 5)
    if (isWinner) winners.push(memberName(member))
  })

  if (winners.length > 0) {
    await message.channel.send('Congratulations to: ' + winners.join(', '))
  }
}

/**
 * @param args Arguments from Bottimus
 * @returns A category ID, or null if invalid arguments are provided
 */
function getCategoryFromArgs (args: string[]) {
  if (!args || args.length < 1) return getCategoryId('Any')

  const arg = args.shift()
  if (arg.toLowerCase() in categories) return getCategoryId(arg)
  return null
}

export default {
  name: 'trivia2',
  description: 'Beta testing a newer, fancier version of Trivia! Now with nicer buttons!',
  cooldown: 12,

  async execute (client: Client, message: Message, args: string[]) {
    const category = getCategoryFromArgs(args)
    if (!category) {
      const categoriesString = Object.keys(categories).join(' ')
      message.channel.send('Category choices: (leave blank for any): ```' + categoriesString + '```')
      return
    }
    client.updateCooldown(this, message.member.id)

    // Send a message with question details
    const question = await getQuestionData(category)
    const guesses = new Map() as Map<GuessMember, number>
    const messageContent = buildTriviaEmbed(question, guesses, true)
    const gameMsg = await message.channel.send(messageContent)

    const collector = gameMsg.createMessageComponentCollector({ componentType: 'BUTTON', time: 15000 })
    collector.on('collect', async (i) => {
      const guess = parseInt(i.customId)
      console.log(i.customId, guess)
      if (isNaN(guess)) return

      guesses.set(i.member, guess)
      await i.deferUpdate()
      await gameMsg.edit(buildTriviaEmbed(question, guesses, true))
    })

    collector.on('end', async () => {
      await gameMsg.edit(buildTriviaEmbed(question, guesses, false))
      await message.channel.send(`The correct answer is: ${question.answers[question.correct]}`)
      await checkWinners(client, message, guesses, question)
    })
  }
}

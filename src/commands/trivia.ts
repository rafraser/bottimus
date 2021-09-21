import { Client, Message } from '../command'
import { incrementArcadeCredits } from '../arcade'
import { queryHelper } from '../database'
import { MessageEmbed, MessageReaction } from 'discord.js'
import { AllHtmlEntities } from 'html-entities'
import fetch from 'node-fetch'

const entities = new AllHtmlEntities()
const arrayOfLetters = ['A', 'B', 'C', 'D']
const emojiToNum = { '🇦': 0, '🇧': 1, '🇨': 2, '🇩': 3 } as { [emoji: string]: number }

const categories = {
  Science: [17, 17, 17, 18, 19, 27, 28, 30],
  Entertainment: [10, 11, 12, 13, 14, 15, 16, 29, 31, 32],
  Humanities: [22, 22, 20, 23, 24, 25, 25, 26],
  General: [9]
} as { [category: string]: number[] }

function getCategoryId (category: string): number {
  if (category in categories) {
    const ids = categories[category]
    return ids[Math.floor(Math.random() * ids.length)]
  } else {
    const keys = Object.keys(categories)
    return getCategoryId(keys[Math.floor(Math.random() * keys.length)])
  }
}

async function incrementStatScore (client: Client, userid: string, category: string, correct: number) {
  const queryString = 'INSERT INTO arcade_trivia VALUES(?, ?, 1, ?) ON DUPLICATE KEY UPDATE attempted = attempted + 1, correct = correct + VALUES(correct);'
  return await queryHelper(queryString, [userid, category, correct])
}

async function getQuestionData (category: number) {
  const resp = await fetch(`https://opentdb.com/api.php?amount=1&category=${category}&type=multiple`)
  const json = await resp.json()
  const info = json.results[0]

  const data = {} as any
  // Shuffle the correct answer into the other answers
  data.answers = info.incorrect_answers
  data.correct = Math.floor(Math.random() * Math.floor(4))
  data.answers.splice(data.correct, 0, info.correct_answer)

  // Format the question and answers
  data.question = entities.decode(info.question)
  for (let i = 0; i < 4; i++) {
    data.answers[i] = entities.decode(data.answers[i])
  }

  data.category = info.category
  data.difficulty = info.difficulty.charAt(0).toUpperCase() + info.difficulty.slice(1)
  return data
}

export default {
  name: 'trivia',
  description: 'Play a trivia question\nClick on the reaction to make your guess. No cheating!',
  aliases: ['quiz'],
  cooldown: 12,

  async execute (client: Client, message: Message, args: string[]) {
    // Get category from arguments
    let category = 9
    if (!args || args.length < 1) {
      category = getCategoryId('Any')
    } else {
      const arg = args.shift()
      if (arg in categories) {
        category = getCategoryId(arg)
      } else {
        const categoriesString = Object.keys(categories).join(' ')
        message.channel.send('Category choices: (leave blank for any): ```' + categoriesString + '```')
        return
      }
    }
    client.updateCooldown(this, message.member.id)

    const data = await getQuestionData(category)
    const embed = new MessageEmbed()
      .setColor('#4cd137')
      .setTitle(data.category)
      .setDescription(data.question)
      .setFooter('Difficulty: ' + data.difficulty)
      .addField('A', data.answers[0])
      .addField('B', data.answers[1])
      .addField('C', data.answers[2])
      .addField('D', data.answers[3])

    // Send message and add the reactions
    const msg = await message.channel.send({ embeds: [embed] })
    msg.react('🇦')
    msg.react('🇧')
    msg.react('🇨')
    msg.react('🇩')

    const filter = function (r: MessageReaction) {
      const n = r.emoji.name
      return (n === '🇦' || n === '🇧' || n === '🇨' || n === '🇩')
    }
    const collected = await msg.awaitReactions({ filter, time: 15000 })

    await message.channel.send('The correct answer is: ' + arrayOfLetters[data.correct])

    // Sort out all the guesses, disqualifying anyone that guessed multiple times
    const guesses = new Map()
    collected.forEach((reaction: MessageReaction) => {
      reaction.users.cache.forEach(user => {
        if (user.bot) return

        if (guesses.get(user.id)) {
          guesses.set(user.id, 'DQ')
        } else {
          guesses.set(user.id, emojiToNum[reaction.emoji.name])
        }
      })
    })

    // From all the guesses, now determine who won
    const winners = [] as string[]
    guesses.forEach((guess, id) => {
      const c = (guess === data.correct) ? 1 : 0
      if (c) {
        const username = message.guild.members.cache.get(id).displayName
        winners.push(username)
      }

      // Increment stat points
      incrementStatScore(client, id, data.category, c)
      incrementArcadeCredits(id, 5 + (c * 10))
    })

    // Message if there is any winners
    if (winners.length > 0) {
      await message.channel.send('Congratulations to: ' + winners.join(', '))
    }
  }
}

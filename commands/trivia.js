const discord = require('discord.js')
const https = require('https')
const pool = require('../util/database')
const arcade = require('../util/arcade')
const HtmlEntities = require('html-entities').AllHtmlEntities
const entities = new HtmlEntities()

const arrayOfLetters = ['A', 'B', 'C', 'D']
const emojiToNum = { '🇦': 0, '🇧': 1, '🇨': 2, '🇩': 3 }

const categories = {
  'Science': [17, 17, 17, 18, 19, 27, 28, 30],
  'Entertainment': [10, 11, 12, 13, 14, 15, 16, 29, 31, 32],
  'Humanities': [22, 22, 20, 23, 24, 25, 25, 26],
  'General': [9]
}

function getCategoryId(category) {
  if (category in categories) {
    const ids = categories[category]
    return ids[Math.floor(Math.random() * ids.length)]
  } else {
    const keys = Object.keys(categories)
    return getCategoryId(keys[Math.floor(Math.random() * keys.length)])
  }
}

function incrementStatScore(userid, category, correct) {
  const queryString = 'INSERT INTO arcade_trivia VALUES(?, ?, 1, ?) ON DUPLICATE KEY UPDATE attempted = attempted + 1, correct = correct + VALUES(correct);'

  pool.query(queryString, [userid, category, correct], (err, results) => {
    if (err) {
      console.log(err)
    }
  })
}

function getQuestionData(category) {
  return new Promise((resolve, reject) => {
    // Query the data from OpenTDB
    https.get(`https://opentdb.com/api.php?amount=1&category=${category}&type=multiple`, resp => {
      resp.data = ''
      resp.on('data', chunk => {
        resp.data += chunk
      })

      resp.on('end', () => {
        let info
        try {
          info = JSON.parse(resp.data).results[0]
        } catch (error) {
          reject(new Error('Invalid question data'))
          return
        }

        let data = {}
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
        resolve(data)
      })
    })
  })
}

module.exports = {
  name: 'trivia',
  description: 'Play a trivia question\nClick on the reaction to make your guess. No cheating!',
  aliases: ['quiz'],
  cooldown: 12,
  execute(message, args, client) {
    let category = 9
    if (!args || args.length < 1) {
      category = getCategoryId('Any')
    } else {
      let arg = args.shift()
      if (arg in categories) {
        category = getCategoryId(arg)
      } else {
        const categoriesString = Object.keys(categories).join(' ')
        message.channel.send('Category choices: (leave blank for any): ```' + categoriesString + '```')
        return
      }
    }

    getQuestionData(category).then(data => {
      // Create an embed for the question
      const embed = new discord.MessageEmbed()
        .setColor('#4cd137')
        .setTitle(data.category)
        .setDescription(data.question)
        .setFooter('Difficulty: ' + data.difficulty)
        .addField('A', data.answers[0])
        .addField('B', data.answers[1])
        .addField('C', data.answers[2])
        .addField('D', data.answers[3])

      // Send the embed and prepare the reactions
      message.channel.send(embed).then(msg => {
        // sorry
        msg.react('🇦').then(() => { msg.react('🇧').then(() => { msg.react('🇨').then(() => { msg.react('🇩') }) }) })

        // Filter out any reactions that aren't guesses
        const filter = function (r) {
          const n = r.emoji.name
          return (n === '🇦' || n === '🇧' || n === '🇨' || n === '🇩')
        }

        // Wait 15 seconds for reactions
        msg.awaitReactions(filter, { time: 15000 }).then(collected => {
          message.channel.send('The correct answer is: ' + arrayOfLetters[data.correct])

          // Sort out all the guesses, disqualifying anyone that guessed multiple times
          let guesses = new Map()
          collected.forEach(reaction => {
            reaction.users.cache.forEach(user => {
              if (user.bot) return

              if (guesses.get(user.id)) {
                guesses.set(user.id, 'DQ')
              } else {
                guesses.set(user.id, emojiToNum[reaction._emoji.name])
              }
            })
          })

          // From all the guesses, determine who won
          let winners = []
          guesses.forEach((guess, id) => {
            const c = (guess === data.correct) ? 1 : 0
            if (c) {
              const username = message.guild.members.cache.get(id).displayName
              winners.push(username)
            }

            // Increment stat points
            incrementStatScore(id, data.category, c)
            arcade.incrementArcadeCredits(id, 1 + (c * 4))
          })

          // Message if there is any winners
          if (winners.length > 0) {
            message.channel.send('Congratulations to: ' + winners.join(', '))
          }
        })
      })
    }).catch(error => {
      message.channel.send(error)
    })
  }
}

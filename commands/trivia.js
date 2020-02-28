const discord = require('discord.js')
const https = require('https')
const pool = require('../util/database')
const arcade = require('../util/arcade')
const HtmlEntities = require('html-entities').AllHtmlEntities
const entities = new HtmlEntities()

const arrayOfLetters = ['A', 'B', 'C', 'D']
const emojiToNum = { '🇦': 0, '🇧': 1, '🇨': 2, '🇩': 3 }

function incrementStatScore(userid, category, correct) {
  const queryString = 'INSERT INTO arcade_trivia VALUES(?, ?, 1, ?) ON DUPLICATE KEY UPDATE attempted = attempted + 1, correct = correct + VALUES(correct);'

  pool.query(queryString, [userid, category, correct], function (err, results) {
    if (err) {
      console.log(err)
    }
  })
}

function getQuestionData() {
  return new Promise(function (resolve, reject) {
    // Query the data from OpenTDB
    https.get('https://opentdb.com/api.php?amount=1&type=multiple', function (resp) {
      resp.data = ''
      resp.on('data', function (chunk) {
        resp.data += chunk
      })

      resp.on('end', function () {
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
  description: 'Play a trivia question',
  cooldown: 12,
  execute(message, args, client) {
    getQuestionData().then(function (data) {
      // Create an embed for the question
      const embed = new discord.RichEmbed()
        .setColor('#4cd137')
        .setTitle(data.category)
        .setDescription(data.question)
        .setFooter('Difficulty: ' + data.difficulty)
        .addField('A', data.answers[0])
        .addField('B', data.answers[1])
        .addField('C', data.answers[2])
        .addField('D', data.answers[3])

      // Send the embed and prepare the reactions
      message.channel.send(embed).then(function (msg) {
        // sorry
        msg.react('🇦').then(function () { msg.react('🇧').then(function () { msg.react('🇨').then(function () { msg.react('🇩') }) }) })

        // Filter out any reactions that aren't guesses
        const filter = function (r) {
          const n = r.emoji.name
          return (n === '🇦' || n === '🇧' || n === '🇨' || n === '🇩')
        }

        // Wait 15 seconds for reactions
        msg.awaitReactions(filter, { time: 15000 }).then(function (collected) {
          message.channel.send('The correct answer is: ' + arrayOfLetters[data.correct])

          // Sort out all the guesses, disqualifying anyone that guessed multiple times
          let guesses = new Map()
          collected.forEach(function (reaction) {
            reaction.users.forEach(function (user) {
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
          guesses.forEach(function (guess, id) {
            const c = (guess === data.correct) ? 1 : 0
            if (c) {
              const username = message.guild.members.get(id).displayName
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
    }).catch(function (error) {
      message.channel.send(error)
    })
  }
}

const discord = require('discord.js')
const arcade = require('../util/arcade')
const pool = require('../util/database')
const words = require('../util/hangman_words')

function incrementStatScore(userid, guesses, correct, revealed, won, contribution) {
  // Sorry
  const queryString = 'INSERT INTO arcade_hangman VALUES(?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE guesses = guesses + VALUES(guesses), correct = correct + VALUES(correct), revealed = revealed + VALUES(revealed), contribution = ((contribution*words)+VALUES(contribution))/(words+1), words = words + VALUES(words);'

  pool.query(queryString, [userid, guesses, correct, revealed, won, contribution], function (err, results) {
    if (err) {
      console.log(err)
    }
  })
}

function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)]
}

function generateEmbed(attempts, guesses, fails) {
  const embed = new discord.RichEmbed()
    .setTitle('Hangman')
    .setDescription((8 - fails) + ' mistakes left!')
    .setFooter(attempts.join(' '))
    .setColor('#d63031')
    .addField(guesses.join(' '), '\u200b')
  return embed
}

function isPlayingHangman(client, guild) {
  // Create the structure if it doesn't exist
  if (!client.hangmanSessions) {
    client.hangmanSessions = new discord.Collection()
  }

  return client.hangmanSessions.has(guild.id)
}

function setPlayingHangman(client, guild, active) {
  // Create the structure if it doesn't exist
  if (!client.hangmanSessions) {
    client.hangmanSessions = new discord.Collection()
  }

  // Update the collection
  if (active) {
    client.hangmanSessions.set(guild.id, true)
  } else {
    client.hangmanSessions.delete(guild.id)
  }
}

function hangmanFilter(msg) {
  if (msg.member.user.bot) return false
  if (msg.content.length > 1) return false
  if (msg.content === '' || msg.content === ' ') return false
  return ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(msg.content) > -1)
}

module.exports = {
  name: 'hangman',
  description: 'Play a game of Hangman',
  execute(message, args, client) {
    // Make sure each guild only has a single game going on
    if (isPlayingHangman(client, message.guild)) return
    setPlayingHangman(client, message.guild, true)

    // Setup the game properties
    let word = getRandomWord()
    let fails = 0
    let correct = 0
    let attempts = []
    let guesses = Array(word.length).fill('\\_')

    // Setup some collections for player data
    let playerGuesses = new Map()
    let playerCorrect = new Map()
    let playerRevealed = new Map()

    message.channel.send('Type capital letters to guess!', generateEmbed(attempts, guesses, fails)).then(function (gameMsg) {
      const collector = gameMsg.channel.createMessageCollector(hangmanFilter, { time: 60000 })
      collector.on('collect', function (m) {
        // Check words for valid guesses
        let letter = m.content
        let user = m.member

        // Don't count guesses twice
        if (attempts.includes(letter)) {
          gameMsg.channel.send(letter + ' has already been guessed!').then(function (msg) { msg.delete(1000) })
          m.delete()
          return
        }

        attempts.push(letter)
        if (word.indexOf(letter) === -1) {
          // Incorrect guess, oh no :(
          gameMsg.channel.send('Uh oh! ' + letter + ' is not in the word!').then(function (msg) { msg.delete(1000) })
          fails++

          // Track guesses per user
          if (playerGuesses.get(user.id)) {
            playerGuesses.set(user.id, playerGuesses.get(user.id) + 1)
          } else {
            playerGuesses.set(user.id, 1)
          }
        } else {
          // Correct guess!
          gameMsg.channel.send('Good guess! ' + letter + ' is in the word!').then(function (msg) { msg.delete(1000) })

          // Reveal letters in the word
          let revealed = 0
          for (let i = 0; i < word.length; i++) {
            if (word.charAt(i) === letter) {
              guesses[i] = letter
              revealed++
            }
          }
          correct += revealed

          // Track guesses per user
          if (playerGuesses.get(user.id)) {
            playerGuesses.set(user.id, playerGuesses.get(user.id) + 1)
          } else {
            playerGuesses.set(user.id, 1)
          }

          if (playerCorrect.get(user.id)) {
            playerCorrect.set(user.id, playerCorrect.get(user.id) + 1)
            playerRevealed.set(user.id, playerRevealed.get(user.id) + revealed)
          } else {
            playerCorrect.set(user.id, 1)
            playerRevealed.set(user.id, revealed)
          }
        }

        m.delete()

        // Update the embed
        gameMsg.edit(generateEmbed(attempts, guesses, fails))

        // End the game if the word is complete
        if (correct === word.length) {
          collector.stop('win')
        }

        // End the game if there have been 8 failures
        if (fails === 8) {
          collector.stop('lose')
        }
      })

      collector.on('end', function (collected, reason) {
        setPlayingHangman(client, gameMsg.guild, false)

        // Send a message depending on how the game ended
        if (reason === 'win') {
          gameMsg.channel.send('You win! The word was ' + word)
        } else if (reason === 'lose') {
          gameMsg.channel.send('Oh no! :(')
          gameMsg.channel.send('The word was ' + word)
        } else {
          gameMsg.channel.send('Time\'s up! The word was ' + word)
        }

        // Increment stats data for all players
        // TODO
        playerGuesses.forEach(function (guesses, key) {
          const correct = playerCorrect.get(key) || 0
          const revealed = playerRevealed.get(key) || 0
          const contribution = Math.floor((revealed / word.length) * 100)
          const won = (reason === 'win') ? 1 : 0

          incrementStatScore(key, guesses, correct, revealed, won, contribution)
          arcade.incrementArcadeCredits(key, 3 + revealed + (won * 5))
        })
      })
    })
  }
}

const discord = require('discord.js')
const arcade = require('../util/arcade')
const pool = require('../util/database')
const words = require('../util/hangman_words')

function incrementStatScore(userid, guesses, correct, revealed, won, contribution) {
  // Sorry
  var queryString = 'INSERT INTO arcade_hangman VALUES(?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE guesses = guesses + VALUES(guesses), correct = correct + VALUES(correct), revealed = revealed + VALUES(revealed), contribution = ((contribution*words)+VALUES(contribution))/(words+1), words = words + VALUES(words);'

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
  var embed = new discord.RichEmbed()
    .setTitle('Hangman')
    .setDescription((8 - fails) + ' mistakes left!')
    .setFooter(attempts.join(' '))
    .setColor('#d63031')
    .addField(guesses.join(' '), '\u200b')
  return embed
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
    // Only allow a single game of hangman
    if (client.playingHangman) return

    // Setup the game properties
    var word = getRandomWord()
    var fails = 0
    var correct = 0
    var attempts = []
    var guesses = Array(word.length).fill('\\_')
    client.playingHangman = true

    // Setup some collections for player data
    var playerGuesses = new Map()
    var playerCorrect = new Map()
    var playerRevealed = new Map()

    message.channel.send('Type capital letters to guess!', generateEmbed(attempts, guesses, fails)).then(function (gameMsg) {
      var collector = gameMsg.channel.createMessageCollector(hangmanFilter, { time: 60000 })
      collector.on('collect', function (m) {
        // Check words for valid guesses
        var letter = m.content
        var user = m.member

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
          arcade.incrementArcadeCredits(user.id, 1)

          // Reveal letters in the word
          var revealed = 0
          for (var i = 0; i < word.length; i++) {
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
        client.playingHangman = null

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
          var correct = playerCorrect.get(key) || 0
          var revealed = playerRevealed.get(key) || 0
          var contribution = Math.floor((revealed / word.length) * 100)
          var won = (reason === 'win') ? 1 : 0
          incrementStatScore(key, guesses, correct, revealed, won, contribution)
        })
      })
    })
  }
}

import { Client, Message } from '../command'
import { incrementArcadeCredits } from '../arcade'
import { hangmanWords } from '../words/hangman'
import { Guild, MessageEmbed } from 'discord.js'
import { queryHelper } from '../database'

const NUM_ATTEMPTS = 8

async function incrementStatScore (client: Client, userid: string, guesses: number, correct: number, revealed: number, won: number, contribution: number) {
  const queryString = 'INSERT INTO arcade_hangman VALUES(?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE guesses = guesses + VALUES(guesses), correct = correct + VALUES(correct), revealed = revealed + VALUES(revealed), contribution = ((contribution*words)+VALUES(contribution))/(words+1), words = words + VALUES(words);'
  return queryHelper(queryString, [userid, guesses, correct, revealed, won, contribution])
}

function getRandomWord () {
  return hangmanWords[Math.floor(Math.random() * hangmanWords.length)]
}

function generateEmbed (attempts: string[], guesses: string[], fails: number) {
  const embed = new MessageEmbed()
    .setTitle('Hangman')
    .setDescription((NUM_ATTEMPTS - fails) + ' mistakes left!')
    .setFooter(attempts.join(' '))
    .setColor('#d63031')
    .addField(guesses.join(' '), '\u200b')
  return embed
}

function isPlayingHangman (client: Client, guild: Guild) {
  // Create the structure if it doesn't exist
  if (!client.hangmanSessions) {
    client.hangmanSessions = new Map()
  }

  return client.hangmanSessions.has(guild.id)
}

function setPlayingHangman (client: Client, guild: Guild, active: boolean) {
  // Create the structure if it doesn't exist
  if (!client.hangmanSessions) {
    client.hangmanSessions = new Map()
  }

  // Update the collection
  if (active) {
    client.hangmanSessions.set(guild.id, true)
  } else {
    client.hangmanSessions.delete(guild.id)
  }
}

function hangmanFilter (msg: Message) {
  if (msg.member.user.bot) return false
  if (msg.content.length > 1) return false
  if (msg.content === '' || msg.content === ' ') return false
  return ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(msg.content) > -1)
}

export default {
  name: 'hangman',
  description: 'Play a game of Hangman\nType *capital* letters to guess.\nYou get one coin for each letter revealed, plus a participation bonus at the end of the game.',

  async execute (client: Client, message: Message, args: string[]) {
    // Make sure each guild only has a single game going on
    if (isPlayingHangman(client, message.guild)) return
    setPlayingHangman(client, message.guild, true)

    // Setup the game properties
    const word = getRandomWord()
    let fails = 0
    let correct = 0
    const attempts = [] as string[]
    const guesses = Array(word.length).fill('\\_')

    // Setup some collections for player data
    const playerGuesses = new Map()
    const playerCorrect = new Map()
    const playerRevealed = new Map()

    const gameMsg = await message.channel.send('Type capital letters to guess!', generateEmbed(attempts, guesses, fails))
    const collector = gameMsg.channel.createMessageCollector(hangmanFilter, { time: 60000 })
    collector.on('collect', m => {
      // Check words for valid guesses
      const letter = m.content
      const user = m.member

      // Don't count guesses twice
      if (attempts.includes(letter)) {
        gameMsg.channel.send(letter + ' has already been guessed!').then(msg => { msg.delete({ timeout: 1000, reason: 'Hangman cleanup' }) })
        m.delete()
        return
      }

      attempts.push(letter)
      if (word.indexOf(letter) === -1) {
        // Incorrect guess, oh no :(
        gameMsg.channel.send('Uh oh! ' + letter + ' is not in the word!').then(msg => { msg.delete({ timeout: 1000, reason: 'Hangman cleanup' }) })
        fails++

        // Track guesses per user
        if (playerGuesses.get(user.id)) {
          playerGuesses.set(user.id, playerGuesses.get(user.id) + 1)
        } else {
          playerGuesses.set(user.id, 1)
        }
      } else {
        // Correct guess!
        gameMsg.channel.send('Good guess! ' + letter + ' is in the word!').then(msg => { msg.delete({ timeout: 1000, reason: 'Hangman cleanup' }) })

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

    collector.on('end', (collected, reason) => {
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
      playerGuesses.forEach((guesses, key) => {
        const correct = playerCorrect.get(key) || 0
        const revealed = playerRevealed.get(key) || 0
        const contribution = Math.floor((revealed / word.length) * 100)
        const won = (reason === 'win') ? 1 : 0

        incrementStatScore(client, key, guesses, correct, revealed, won, contribution)
        incrementArcadeCredits(key, 3 + revealed + (won * 5))
      })
    })
  }
}

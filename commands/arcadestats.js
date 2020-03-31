const pool = require('../util/database')
const discord = require('discord.js')

// Calculate the totals across all trivia categories
function calculateTriviaTotals(results) {
  const totalGuesses = 0
  const totalCorrect = 0

  for (const result of results) {
    totalGuesses = totalGuesses + result.attempted
    totalCorrect = totalCorrect + result.correct
  }

  return [totalGuesses, totalCorrect]
}

// Helper function to get statistics
function queryHelper(queryString, id) {
  return new Promise(function (resolve, reject) {
    pool.query(queryString, [id], function (err, results) {
      if (err) {
        reject(err)
      } else {
        resolve(results)
      }
    })
  })
}

// Retrieve Hangman statistics for a given ID from the database
function fetchHangmanStatistics(id) {
  return queryHelper('SELECT guesses, correct, revealed, words, contribution, (correct/guesses) AS percent FROM arcade_hangman WHERE discordid = ?;', id)
}

// Retrieve Trivia statistics for a given ID from the database
function fetchTriviaStatistics(id) {
  return queryHelper('SELECT category, attempted, correct, (correct/attempted) AS percent FROM arcade_trivia WHERE discordid = ? ORDER BY (correct/attempted) DESC;', id)
}

// Retrieve Typeracer statistics for a given ID from the database
function fetchTyperacerStatistics(id) {
  return queryHelper('SELECT completed, speed_average, speed_best, date_best FROM arcade_typeracer WHERE discordid = ?;', id)
}

// Retrieve Scratchcard statistics for a given ID from the database
function fetchScratchcardStatistics(id) {
  return queryHelper('SELECT number, winnings, ROUND(winnings/number, 2) AS average FROM arcade_scratchcard WHERE discordid = ?;', id)
}

// Retrieve Mining statistics for a given ID from the database
function fetchMiningStatistics(id) {
  return queryHelper('SELECT number, diamonds, FLOOR(diamonds/number) AS average FROM arcade_mining WHERE discordid = ?;', id)
}

// Retrieve Prize statistics for a given ID from the database
function fetchPrizeStatistics(id) {
  return queryHelper('SELECT SUM(amount) AS total, COUNT(amount) AS collected FROM arcade_prizes WHERE discordid = ?;', id)
}

// Retrieve Roulette statistics for a given ID from the database
function fetchRouletteStatistics(id) {
  return queryHelper('SELECT number, winnings, ROUND(winnings/number, 2) AS payout_average, ROUND(bet_total/number, 2) AS bet_average, bet_total FROM arcade_roulette WHERE discordid = ?;', id)
}

// Keep the embed functions in an object for modular lookup
let embedFunctions = {}

// Generate a nice embed for Hangman information
embedFunctions.hangman = function (user) {
  return new Promise(function (resolve, reject) {
    fetchHangmanStatistics(user.id).then(function (results) {
      const username = user.displayName
      const r = results[0]

      // Generate a nice embed for details
      const embed = new discord.RichEmbed()
        .setColor('#4cd137')
        .setTitle(`🚷 Hangman -  ${username}`)
        .addField('Letters Guessed', `${r.guesses}`, true)
        .addField('Letters Correct', `${r.correct}`, true)
        .addField('Percentage', `${Math.floor(r.percent * 100) || 0}%`, true)
        .addField('Revealed', `${r.revealed}`, true)
        .addField('Words Contributed', `${r.words}`, true)
        .addField('Contribution', `${r.contribution}%`, true)
      resolve(embed)
    }).catch(function (err) {
      reject(err)
    })
  })
}

// Generate a nice embed for Trivia information
embedFunctions.trivia = function (user) {
  return new Promise(function (resolve, reject) {
    fetchTriviaStatistics(user.id).then(function (results) {
      const username = user.displayName
      const [totalGuesses, totalCorrect] = calculateTriviaTotals(results)

      // Generate a nice embed for details
      const embed = new discord.RichEmbed()
        .setColor('#4cd137')
        .setTitle(`❓ Trivia - ${username}`)
        .addField('Questions Answered', `${totalGuesses}`, true)
        .addField('Questions Correct', `${totalCorrect}`, true)
        .addField('Percentage', `${Math.floor((totalCorrect / totalGuesses) * 100) || 0}%`, true)
      resolve(embed)
    }).catch(function (err) {
      reject(err)
    })
  })
}

// Generate a nice embed for Typeracer information
embedFunctions.typeracer = function (user) {
  return new Promise(function (resolve, reject) {
    fetchTyperacerStatistics(user.id).then(function (results) {
      const username = user.displayName
      const r = results[0]

      // Format the date nicely
      // Who knew this would be the worst part of all this
      const d = r.date_best
      const day = (d.getDate()).toString().padStart(2, '0')
      const month = (d.getMonth() + 1).toString().padStart(2, '0')
      const year = d.getFullYear().toString()
      const best = day + '-' + month + '-' + year

      // Generate a nice embed for details
      const embed = new discord.RichEmbed()
        .setColor('#4cd137')
        .setTitle(`🏎 Type Racer - ${username}`)
        .addField('Races Completed', `${r.completed}`, true)
        .addField('Average Speed', `${r.speed_average}WPM`, true)
        .addField('Best Speed', `${r.speed_best}WPM`, true)
        .addField('Record Date', `${best}`, true)
      resolve(embed)
    }).catch(function (err) {
      reject(err)
    })
  })
}

embedFunctions.scratchcard = function (user) {
  return new Promise(function (resolve, reject) {
    fetchScratchcardStatistics(user.id).then(function (results) {
      const username = user.displayName
      const r = results[0]

      // Generate a nice embed for details
      const embed = new discord.RichEmbed()
        .setColor('#4cd137')
        .setTitle(`💸 Scratch Cards - ${username}`)
        .addField('Number', `${r.number}`, true)
        .addField('Total Winnings', `${r.winnings}`, true)
        .addField('Profit', `${r.winnings - r.number * 250}`, true)
        .addField('Average Income', `${r.average}`, true)
      resolve(embed)
    }).catch(function (err) {
      reject(err)
    })
  })
}

embedFunctions.mining = function (user) {
  return new Promise(function (resolve, reject) {
    fetchMiningStatistics(user.id).then(function (results) {
      const username = user.displayName
      const r = results[0]

      // Generate a nice embed for details
      const embed = new discord.RichEmbed()
        .setColor('#4cd137')
        .setTitle(`💎 Mining - ${username}`)
        .addField('Expeditions', `${r.number}`, true)
        .addField('Diamonds', `${r.diamonds}`, true)
        .addField('Average', `${r.average}`, true)
        .addField('Earnings', `${r.diamonds * 5}`, true)
        .addField('Profit', `${r.diamonds * 5 - r.number * 25}`, true)
      resolve(embed)
    }).catch(function (err) {
      reject(err)
    })
  })
}

embedFunctions.prizes = function (user) {
  return new Promise(function (resolve, reject) {
    fetchPrizeStatistics(user.id).then(function (results) {
      const username = user.displayName
      const r = results[0]

      // Generate a nice embed for details
      const embed = new discord.RichEmbed()
        .setColor('#4cd137')
        .setTitle(`🔮 Prizes - ${username}`)
        .addField('Total', `${r.total}`, true)
        .addField('Unique', `${r.collected}`, true)
      resolve(embed)
    }).catch(function (err) {
      reject(err)
    })
  })
}

embedFunctions.roulette = function (user) {
  return new Promise(function (resolve, reject) {
    fetchRouletteStatistics(user.id).then(function (results) {
      const username = user.displayName
      const r = results[0]

      // Generate a nice embed for details
      const embed = new discord.RichEmbed()
        .setColor('#4cd137')
        .setTitle(`💸 Roulette - ${username}`)
        .addField('Number', `${r.number}`, true)
        .addField('Total Winnings', `${r.winnings}`, true)
        .addField('Total Bet', `${r.bet_total}`, true)
        .addField('Profit', `${r.winnings - r.bet_total}`, true)
        .addField('Average Income', `${r.payout_average}`, true)
        .addField('Average Bet', `${r.bet_average}`, true)
      resolve(embed)
    }).catch(function (err) {
      reject(err)
    })
  })
}

module.exports = {
  name: 'arcadestats',
  description: 'Fetchs statistics for arcade games.\nFor a list of stat types:`!arcadestats`\nFor your statistics:`!arcadestats [type]`\nFor someone else\'s statistics:`!arcadestats [user] [type]`',
  aliases: ['gamestats', 'casinostats'],
  execute(message, args, client) {
    if (!args || args.length < 1) {
      const games = Object.keys(embedFunctions).join(' ')
      message.channel.send('Pick stats to see:```' + games + '```')
      return
    }

    const user = client.findUser(message, args, true)
    let promises = []

    // For each argument, attempt to get stats for that game
    for (let arg of args) {
      arg = arg.toLowerCase()
      if (embedFunctions[arg]) {
        promises.push(embedFunctions[arg](user))
      }
    }

    // Fancy promise stuff
    // This runs all of the given promises, ignoring any errors
    let m = promises.map(function (p) {
      return p.catch(function (err) {
        console.log(err)
        return null
      })
    })

    Promise.all(m).then(function (results) {
      if (results.length < 1) {
        message.channel.send('No data available')
      } else {
        for (let i = 0; i < results.length; i++) {
          if (results[i] == null) { continue }
          message.channel.send(results[i])
        }
      }
    })
  }
}

const pool = require('../database')
const discord = require('discord.js')

// Calculate the totals across all trivia categories
function calculateTriviaTotals (results) {
  var totalGuesses = 0
  var totalCorrect = 0

  for (result of results) {
    totalGuesses = totalGuesses + result.attempted
    totalCorrect = totalCorrect + result.correct
  }

  return [totalGuesses, totalCorrect]
}

// Retrieve Hangman statistics for a given ID from the database
function fetchHangmanStatistics (id) {
  return new Promise(function (resolve, reject) {
    var queryString = 'SELECT guesses, correct, revealed, words, contribution, (correct/guesses) AS percent FROM arcade_hangman WHERE discordid = ?;'
    pool.query(queryString, [id], function (err, results) {
      if (err) {
        reject(err)
      } else {
        resolve(results)
      }
    })
  })
}

// Retrieve Trivia statistics for a given ID from the database
function fetchTriviaStatistics (id) {
  return new Promise(function (resolve, reject) {
    var queryString = 'SELECT category, attempted, correct, (correct/attempted) AS percent FROM arcade_trivia WHERE discordid = ? ORDER BY (correct/attempted) DESC;'
    pool.query(queryString, [id], function (err, results) {
      if (err) {
        reject(err)
      } else {
        resolve(results)
      }
    })
  })
}

// Retrieve Typeracer statistics for a given ID from the database
function fetchTyperacerStatistics (id) {
  return new Promise(function (resolve, reject) {
    var queryString = 'SELECT completed, speed_average, speed_best, date_best FROM arcade_typeracer WHERE discordid = ?;'
    pool.query(queryString, [id], function (err, results) {
      if (err) {
        reject(err)
      } else {
        resolve(results)
      }
    })
  })
}

// Keep the embed functions in an object for modular lookup
var embedFunctions = {}

// Generate a nice embed for Hangman information
embedFunctions.hangman = function (user) {
  return new Promise(function (resolve, reject) {
    fetchHangmanStatistics(user.id).then(function (results) {
      var username = user.displayName
      var r = results[0]

      // Generate a nice embed for details
      var embed = new discord.RichEmbed()
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
      var username = user.displayName
      var [totalGuesses, totalCorrect] = calculateTriviaTotals(results)

      // Generate a nice embed for details
      var embed = new discord.RichEmbed()
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
      var username = user.displayName
      var r = results[0]

      // Format the date nicely
      // Who knew this would be the worst part of all this
      var d = r.date_best
      var day = (d.getDate()).toString().padStart(2, '0')
      var month = (d.getMonth() + 1).toString().padStart(2, '0')
      var year = d.getFullYear().toString()
      var best = day + '-' + month + '-' + year

      // Generate a nice embed for details
      var embed = new discord.RichEmbed()
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

module.exports = {
  name: 'arcadestats',
  description: 'Fetchs statistics for arcade games',
  aliases: ['gamestats'],
  execute (message, args, client) {
    var user = client.findUser(message, args, true)
    var game = args.shift()

    // Get stats for all games, or a single game if given
    var promises = []
    if (game && embedFunctions.hasOwnProperty(game.toLowerCase())) {
      promises.push(embedFunctions[game](user))
    } else {
      for (var game in embedFunctions) {
        promises.push(embedFunctions[game](user))
      }
    }

    // Fancy promise stuff
    // This runs all of the given promises, ignoring any errors
    var m = promises.map(function (p) {
      return p.catch(function (err) {
        console.log(err)
        return null
      })
    })
    Promise.all(m).then(function (results) {
      if (results.length < 1) {
        message.channel.send('This user has not played any arcade games :(')
      } else {
        for (var i = 0; i < results.length; i++) {
          if (results[i] == null) { continue }
          message.channel.send(results[i])
        }
      }
    })
  }
}

const pool = require('../database')
const discord = require('discord.js')

function calculateTotals (results) {
  var totalGuesses = 0
  var totalCorrect = 0

  for (const result of results) {
    totalGuesses = totalGuesses + result.attempted
    totalCorrect = totalCorrect + result.correct
  }

  return [totalGuesses, totalCorrect]
}

function fetchStatistics (id) {
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

module.exports = {
  name: 'triviastats',
  description: 'Fetchs statistics from Trivia',
  execute (message, args, client) {
    var user = client.findUser(message, args, true)

    fetchStatistics(user.id).then(function (results) {
      var username = user.displayName
      var [totalGuesses, totalCorrect] = calculateTotals(results)

      // Generate a nice embed for details
      var embed = new discord.RichEmbed()
        .setColor('#4cd137')
        .setTitle(`Trivia Stats for ${username}`)
        .addField('Questions Answered', `${totalGuesses}`, true)
        .addField('Questions Correct', `${totalCorrect}`, true)
        .addField('Percentage', `${Math.floor((totalCorrect / totalGuesses) * 100) || 0}%`, true)

      // Wait until the first message is sent
      message.channel.send(embed).then(function () {
        // Generate a fancy breakdown of the trivia categories
        // This uses code formatting for extra coolness
        var codestring = '```python\n\n'
        for (const result of results) {
          var qstring = (result.correct + '/' + result.attempted).padStart(8, ' ')
          var pcstring = ' (' + Math.floor(result.percent * 100) + '%)'
          codestring += result.category.padEnd(40, ' ') + qstring + pcstring + '\n'
        }
        codestring += '```'
        message.channel.send(codestring)
      })
    }).catch(function (err) {
      message.channel.send('Could not get stats :(')
      message.channel.send(err.toString())
    })
  }
}

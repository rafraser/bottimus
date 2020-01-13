const pool = require('../database')
const discord = require('discord.js')

function calculateTotals (results) {
  var total_guesses = 0
  var total_correct = 0

  for (result of results) {
    total_guesses = total_guesses + result.attempted
    total_correct = total_correct + result.correct
  }

  return [total_guesses, total_correct]
}

function fetchStatistics (id) {
  return new Promise(function (resolve, reject) {
    var query_string = 'SELECT category, attempted, correct, (correct/attempted) AS percent FROM arcade_trivia WHERE discordid = ? ORDER BY (correct/attempted) DESC;'
    pool.query(query_string, [id], function (err, results) {
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
    var query_string = 'SELECT category, attempted, correct, (correct/attempted) AS percent FROM arcade_trivia WHERE discordid = ? ORDER BY (correct/attempted) DESC;'
    var user = client.findUser(message, args, true)

    fetchStatistics(user.id).then(function (results) {
      var username = user.displayName
      var [total_guesses, total_correct] = calculateTotals(results)

      // Generate a nice embed for details
      var embed = new discord.RichEmbed()
        .setColor('#4cd137')
        .setTitle(`Trivia Stats for ${username}`)
        .addField('Questions Answered', `${total_guesses}`, true)
        .addField('Questions Correct', `${total_correct}`, true)
        .addField('Percentage', `${Math.floor((total_correct / total_guesses) * 100) || 0}%`, true)

      // Wait until the first message is sent
      message.channel.send(embed).then(function () {
        // Generate a fancy breakdown of the trivia categories
        // This uses code formatting for extra coolness
        var codestring = '```python\n\n'
        for (result of results) {
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

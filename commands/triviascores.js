const pool = require('../util/database')

module.exports = {
  name: 'triviascores',
  description: 'Generates a Trivia leaderboard\nYou can either view percentage or total: `!triviascores percentage` `!triviascores total`',
  execute(message, args, client) {
    // Friendly join multiple arguments for the name
    if (args.length > 1) {
      args[0] = args.slice(0).join(' ')
    }

    // Default argument
    if (args.length < 1) {
      args[0] = 'percentage'
    }

    let queryString
    if (args[0].toLowerCase() === 'percentage') {
      queryString = "SELECT u.username, CONCAT(FLOOR(SUM(correct)/SUM(attempted)*100), '%') AS score FROM arcade_trivia t LEFT JOIN bottimus_userdata u on t.discordid = u.discordid GROUP BY t.discordid HAVING SUM(attempted) >= 10 ORDER BY SUM(correct)/SUM(attempted) DESC LIMIT 10;"
    } else if (args[0].toLowerCase() === 'total') {
      queryString = 'SELECT u.username, SUM(correct) AS score FROM arcade_trivia t LEFT JOIN bottimus_userdata u on t.discordid = u.discordid GROUP BY t.discordid ORDER BY score DESC LIMIT 10;'
    } else {
      queryString = "SELECT u.username, CONCAT(FLOOR(SUM(correct)/SUM(attempted)*100), '%') AS score FROM arcade_trivia t LEFT JOIN bottimus_userdata u on t.discordid = u.discordid WHERE category = ? GROUP BY t.discordid HAVING SUM(attempted) >= 5 ORDER BY SUM(correct)/SUM(attempted) DESC LIMIT 10;"
    }

    // Query database
    pool.query(queryString, [args[0]], (err, results) => {
      if (err) {
        message.channel.send('Couldn\'t get stats :(')
        message.channel.send(err.toString())
      } else {
        try {
          let codestring = '```yaml\nNum  Username                Score\n----------------------------------\n'
          let i = 1
          for (const result of results) {
            let display = result.username

            const position = client.padOrTrim(`#${i}.`, 5)
            const name = client.padOrTrim(display, 25)
            const score = client.padOrTrim(result.score.toString(), 5)
            codestring += `${position}${name}${score}\n`
            i++
          }

          codestring += '```'
          message.channel.send(codestring)
        } catch (e) {
          console.log(e)
        }
      }
    })
  }
}

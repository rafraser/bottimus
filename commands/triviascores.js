const pool = require('../util/database')

module.exports = {
  name: 'triviascores',
  description: 'Generates a Trivia leaderboard',
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
      queryString = "SELECT discordid, CONCAT(FLOOR(SUM(correct)/SUM(attempted)*100), '%') AS score FROM arcade_trivia GROUP BY discordid HAVING SUM(attempted) >= 10 ORDER BY SUM(correct)/SUM(attempted) DESC LIMIT 10;"
    } else if (args[0].toLowerCase() === 'total') {
      queryString = 'SELECT discordid, SUM(correct) AS score FROM arcade_trivia GROUP BY discordid ORDER BY score DESC LIMIT 10;'
    } else {
      queryString = "SELECT discordid, CONCAT(FLOOR(SUM(correct)/SUM(attempted)*100), '%') AS score FROM arcade_trivia WHERE category = ? GROUP BY discordid HAVING SUM(attempted) >= 5 ORDER BY SUM(correct)/SUM(attempted) DESC LIMIT 10;"
    }

    // Query database
    pool.query(queryString, [args[0]], function (err, results) {
      if (err) {
        message.channel.send('Couldn\'t get stats :(')
        message.channel.send(err.toString())
      } else {
        try {
          let codestring = '```yaml\nNum  Username                Score\n----------------------------------\n'
          let i = 1
          for (const result of results) {
            const u = client.users.get(result.discordid)
            let display = result.discordid
            if (u) { display = u.username }

            const position = client.padOrTrim(`#${i}.`, 5)
            const name = client.padOrTrim(display, 25)
            const score = client.padOrTrim(result.score, 5)
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

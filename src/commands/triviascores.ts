import { Client, Message } from '../command'
import { queryHelper } from '../database'
import { padOrTrim, padOrTrimLeft } from '../utils'

export default {
  name: 'triviascores',
  description: 'Generates a Trivia leaderboard\nYou can either view percentage or total: `!triviascores percentage` `!triviascores total`',
  cooldown: 15,

  async execute (client: Client, message: Message, args: string[]) {
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

    // Run the query
    const results = await queryHelper(queryString, [args[0]])
    const header = '```yaml\nNum  Username                Score\n----------------------------------\n'
    const text = results.reduce((acc, result, idx) => {
      const display = result.username
      const position = padOrTrim(`#${idx + 1}.`, 5)
      const name = padOrTrim(display, 25)
      const score = padOrTrimLeft(result.score.toString(), 4)
      return acc + `${position}${name}${score}\n`
    }, header) + '```'

    message.channel.send(text)
    client.updateCooldown(this, message.member.id)
  }
}

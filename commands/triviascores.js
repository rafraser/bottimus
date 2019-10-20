const pool = require('../database')
const discord = require('discord.js')

module.exports = {
    name: 'triviascores',
    description: 'Generates a Trivia leaderboard',
    execute(message, args, client) {
        // Friendly join multiple arguments for the name
        if(args.length > 1) {
            args[0] = args.slice(0).join(" ")
        }
        
        // Default argument
        if(args.length < 1) {
            args[0] = 'percentage'
        }
        
        var query_string
        if(args[0].toLowerCase() == 'percentage') {
            query_string = "SELECT discordid, CONCAT(FLOOR(SUM(correct)/SUM(attempted)*100), '%') AS score FROM arcade_trivia GROUP BY discordid HAVING SUM(attempted) >= 10 ORDER BY SUM(correct)/SUM(attempted) DESC LIMIT 10;"
        } else if(args[0].toLowerCase() == 'total') {
            query_string = "SELECT discordid, SUM(correct) AS score FROM arcade_trivia GROUP BY discordid ORDER BY score DESC LIMIT 10;"
        } else {
            query_string = "SELECT discordid, CONCAT(FLOOR(SUM(correct)/SUM(attempted)*100), '%') AS score FROM arcade_trivia WHERE category = ? GROUP BY discordid HAVING SUM(attempted) >= 5 ORDER BY SUM(correct)/SUM(attempted) DESC LIMIT 10;"
        }
        
        // Query database
        pool.query(query_string, [args[0]], function(err, results) {
            if (err) {
                message.channel.send('Couldn\'t get stats :(')
                message.channel.send(err.toString())
            } else {
                try {
                    var codestring = '```yaml\nNum  Username                Score\n----------------------------------\n'
                    var i = 1
                    for(result of results) {
                        var u = client.users.get(result['discordid'])
                        var display = result['discordid']
                        if(u) { display = u.username }
                        
                        codestring += String('#' + i + '.').padEnd(5, ' ') + display.padEnd(24, ' ') + String(result['score']).padStart(5, ' ') + '\n'
                        i++
                    }
                    
                    codestring += '```'
                    message.channel.send(codestring)
                } catch(e) { 
                    console.log(e)
                }
            }
        })
    },
}
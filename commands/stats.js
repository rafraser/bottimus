const pool = require('../database')
const discord = require('discord.js')

module.exports = {
    name: 'stats',
    description: 'Fetchs statistics from Simply Murder',
    execute(message, args) {
        if(!args.length || args.length < 1) { return }
        
        // Friendly join multiple arguments
        if(args.length > 1) {
            args[0] = args.join(" ")
        }
        
        // Determine argument type
        var id = args[0]
        var query_type = 'username'
        if (/^-{0,1}\d+$/.test(id) && id.startsWith('7')) { query_type = 'steamid64' }
        
        // Pick query based on argument given
        var query_string
        if (query_type == 'username') {
            query_string = 'SELECT * FROM playtime p LEFT JOIN stats_murder m ON p.steamid64 = m.steamid64 LEFT JOIN event_cake e ON p.steamid64 = e.steamid64 LEFT JOIN location l ON p.steamid64 = l.steamid64 WHERE p.username=? LIMIT 1'
        } else {
            query_string = 'SELECT * FROM playtime p LEFT JOIN stats_murder m ON p.steamid64 = m.steamid64 LEFT JOIN event_cake e ON p.steamid64 = e.steamid64 LEFT JOIN location l ON p.steamid64 = l.steamid64 WHERE p.steamid64=? LIMIT 1'
        }
        
        // Query database
        pool.query(query_string, [id], function(err, results) {
            if (err) {
                console.log(err)
                message.channel.send('Couldn\'t get stats :(')
                message.channel.send(err.toString())
            } else {
                // results! yay!
                try {
                    var result = results[0]
                    // Generate a fancy looking embed with the user statistics
                    var embed = new discord.RichEmbed()
                        .setColor('')
                        .setTitle(`Stats for ${result.username}`)
                        .addField('Hours Played', `${Math.floor(result.playtime/3600)||0}`, true)
                        .addField('Loot Collected', `${result.loot||0}`, true)
                        .addField('Murders', `${result.murders||0}`, true)
                        .addField('Shot Murderers', `${result.shot_murderer||0}`, true)
                        .addField('Shot Innocents', `${result.shot_innocent||0}`, true)
                        .addField('Shooting %', `${Math.floor(result.shot_murderer/(result.shot_murderer+result.shot_innocent)*100) || 0}%`, true)
                    message.channel.send(embed)
                } catch (e) { 
                    message.channel.send('User not found in database')
                }
            }
        })
    },
}
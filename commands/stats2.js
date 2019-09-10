const pool = require('../database')
const discord = require('discord.js')

function GetMaxExperience(level) {
    if (level < 5) return 100;
    if (level < 10) return 200;
    if (level < 25) return 500;
    return 1000;
}

module.exports = {
    name: 'mgstats',
    description: 'Fetchs statistics from Minigames',
    execute(message, args) {
        if(!args.length || args.length < 2) { return }
        
        // Friendly join multiple arguments for the name
        if(args.length > 1) {
            args[1] = args.slice(1).join(" ")
        }
        
        // Determine argument type
        var id = args[1]
        var query_type = 'username'
        if (/^-{0,1}\d+$/.test(id) && id.startsWith('7')) { query_type = 'steamid64' }
        
        var gamemode = args[0].toLowerCase();
        
        // Pick query based on argument given
        var query_string
        if (query_type == 'username') {
            query_string = 'SELECT * FROM playtime p LEFT JOIN stats_minigames m ON p.steamid64 = m.steamid64 LEFT JOIN minigames_xp xp ON p.steamid64 = xp.steamid64 WHERE p.username=? AND (m.gamemode IS NULL OR m.gamemode=?) LIMIT 1'
        } else {
            query_string = 'SELECT * FROM playtime p LEFT JOIN stats_minigames m ON p.steamid64 = m.steamid64 LEFT JOIN minigames_xp xp ON p.steamid64 = xp.steamid64 WHERE p.steamid64=? AND (m.gamemode IS NULL OR m.gamemode=?) LIMIT 1'
        }
        
        // Query database
        pool.query(query_string, [id, gamemode], function(err, results) {
            if (err) {
                console.log(err)
                message.channel.send('Couldn\'t get stats :(')
                message.channel.send(err.toString())
            } else {
                // results! yay!
                try {
                    var result = results[0]
                    var nice_gamemode = result.gamemode.charAt(0).toUpperCase() + result.gamemode.slice(1)
                    var stats_table = JSON.parse(result.stats)
                    // Generate a fancy looking embed with the user statistics
                    var embed = new discord.RichEmbed()
                        .setColor('#fbc531')
                        .setTitle(`Stats for ${result.username} playing ${nice_gamemode}`)
                        .addField(`Level ${result.level}`, `${result.xp}/${GetMaxExperience(result.level)}XP`, false)
                    
                    // Add a field for each key in the JSON table
                    // If not applicable, add a brief message
                    if (Object.keys(stats_table).length < 1) {
                        embed.setDescription('No gamemode-specific stats found.')
                    } else {
                        for (var key in stats_table) {
                            embed.addField(key, stats_table[key], true)
                        }
                    }
                        
                    message.channel.send(embed)
                } catch (e) { 
                    message.channel.send('No match in database')
                }
            }
        })
    },
}
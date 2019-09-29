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
            query_string = 'SELECT * FROM playtime p WHERE p.username LIKE ? ORDER BY playtime DESC LIMIT 1;'
            id = '%' + id + '%'
        } else {
            query_string = 'SELECT * FROM playtime p WHERE p.steamid64=? LIMIT 1;'
        }
        
        // Query database
        var q = pool.query(query_string, [id], function(err, results) {
            if (err) {
                message.channel.send('Couldn\'t get stats :(')
                message.channel.send(err.toString())
            } else {
                // results! yay!
                try {
                    var result = results[0]
                    // Generate a fancy looking embed with the user statistics
                    var embed = new discord.RichEmbed()
                        .setColor('#e84118')
                        .setTitle(`Stats for ${result.username}`)
                        .addField('Hours Played', `${Math.floor(result.playtime/3600)||0}`, false)
                        .addField('Stats Profile', `http://fluffyservers.com/profile.html?steamid=${result.steamid64}`, false)
                    message.channel.send(embed)
                } catch (e) {
                    message.channel.send('User not found in database')
                }
            }
        })
    },
}
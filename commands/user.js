const discord = require('discord.js')

// Return a sorted array of when users joined the server
function getUserRankings(guild) {
    var p = new Promise(function(resolve, reject) {
        guild.fetchMembers().then(function(g) {
            members = Array.from(g.members.values())
            
            // Sort the list of members by joined time
            members.sort(function(a, b) {
                return a.joinedAt - b.joinedAt
            })
            
            // Resolve the promise with the sorted list of members
            resolve(members)
        }).catch(function(e) {
            // Pass errors back through the promise
            reject(e)
        })
    })
    
    return p
}

module.exports = {
    name: 'user',
    description: 'Get information about when a user joined',
    execute(message, args, client) {
        getUserRankings(message.guild).then(function(rankings) {
            var user
            var ranking
            try {
                // Try searching for a user in the args
                user = client.findUser(message, args.slice())
                ranking = rankings.indexOf(user)
            } catch(e) {
                // Try getting a user number
                ranking = parseInt(args.shift()) - 1
                if(isNaN(ranking)) {
                    // Return the caller
                    user = message.member
                    ranking = rankings.indexOf(user)
                } else {
                    // Number is valid, use that
                    user = rankings[ranking]
                }
            }
            if(ranking < 0 || ranking > rankings.length) return
            
            // Generate the fancy embed
            var date = user.joinedAt.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})
            var embed = new discord.RichEmbed()
            .setTitle(user.displayName)
            .setDescription(user.user.tag)
            .setThumbnail(user.user.avatarURL)
            .setColor('4CD137')
            .addField('Ranking', '#' + (ranking+1) + ' / ' + rankings.length, true)
            .addField('Date', date, true)
            message.channel.send(embed)
        }).catch(function(e) {
            console.error(e)
        })
    },
}
const discord = require('discord.js')

function getUserRankings(client, guild) {
    var members = guild.members;
    members = Array.from(members.values())
    
    members.sort(function(a, b) {
        return a.joinedAt - b.joinedAt
    })
    
    return members
    
    /*
    members.forEach(function(m, i) {
        
        console.log(i, m.displayName, date)      
    })
    */
}

module.exports = {
    name: 'user',
    description: 'Get information about when a user joined',
    execute(message, args, client) {
        if(message.guild.id != '309951255575265280') return;
        var caller = message.member
        var user, ranking
        var rankings = getUserRankings(client, message.guild)
        
        if(!args.length || args.length < 1) {
            for(var i = 0; i < rankings.length; i++) {
                if(rankings[i] == caller) {
                    ranking = i
                    user = caller
                    break
                }
            }
        } else {
            try {
                args[0] = parseInt(args[0])-1
                ranking = args[0]
                user = rankings[args[0]]
            } catch(error) {
                return
            }
        }
        
        var date = user.joinedAt.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})
        var embed = new discord.RichEmbed()
        .setTitle(user.displayName)
        .setDescription(user.user.tag)
        .setThumbnail(user.user.avatarURL)
        .setColor('4CD137')
        .addField('Ranking', '#' + (ranking+1) + ' / ' + rankings.length, true)
        .addField('Date', date, true)
        message.channel.send(embed)
    },
}
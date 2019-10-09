const discord = require('discord.js')
const mutedid = '495945521408770049'

function muteUser(client, member, duration, muter, channel) {
    var roles = member.roles
    var options = {
        guild: member.guild,
        roles: roles,
        unmute: new Date(Date.now() + duration * 60000),
        muter: muter,
        channel: channel
    }
    client.mutesData.set(member.id, options)
    
    // Remove all roles, then add muted role
    roles.forEach(function(role) {
        if(role.id == mutedid) return
        member.removeRole(role).catch(function(e) {})
    })
    member.addRole(member.guild.roles.get(mutedid))
}

function unmuteUser(client, id) {
    var settings = client.mutesData.get(id)
    var member = settings.guild.members.get(id)
    client.mutesData.delete(id)
    
    // Add roles back, then removed muted role
    settings.roles.forEach(function(role) {
        member.addRole(role).catch(function(e) {})
    })
    member.removeRole(member.guild.roles.get(mutedid))
    
    // Reply message
    try {
        settings.channel.send(member.displayName + ' has been unmuted')
    } catch(e) {}
}

function formatDuration(duration) {
    if(duration <= 1) {
        return '1 minute'
    } else if(duration <= 120) {
        return duration + ' minutes'
    } else {
        return (duration/60) + ' hours'
    }
}

module.exports = {
    name: 'mute',
    description: '🛡️ Mute a specified user',
    mute: muteUser,
    unmute: unmuteUser,
    execute(message, args, client) {
        // Check that the user has permission
        if(!client.isModerator(message.member)) {
            message.channel.send('You need to be a Moderator to use this!')
            return
        }
        
        // Create the locally stored mutes storage if it doesn't exist
        if(client.mutesData == null) {
            client.mutesData = new discord.Collection()
        }
        
        try {
            var target = client.findUser(message, args)
            var duration = args.shift() || 30
            
            // Handle muting process in the above functions
            if(client.mutesData.has(target.id)) {
                unmuteUser(client, target.id)
            } else {
                muteUser(client, target, duration, message.member, message.channel)
                
                // Send a cool mute embed
                var embed = new discord.RichEmbed()
                .setColor('#c0392b')
                .setTitle('🦀 ' + target.displayName + ' is gone 🦀')
                .setDescription('They have been banished to the void for ' + formatDuration(duration))
                message.channel.send(embed)
            }
        } catch(error) {
            message.channel.send(error.message)
        }
    },
}
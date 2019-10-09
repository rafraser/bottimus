const discord = require('discord.js')
const fs = require('fs')
const mutedid = '495945521408770049'

function muteUser(client, member, duration, muter, channel) {
    var roles = member.roles
    var roleids = []
    roles.forEach(function(role) {
        roleids.push(role.id)
    })
    
    var options = {
        guild: member.guild.id,
        roles: roleids,
        unmute: new Date(Date.now() + duration * 60000),
        muter: muter.id,
        channel: channel.id
    }
    client.mutesData.set(member.id, options)
    
    // Remove all roles, then add muted role
    roles.forEach(function(role) {
        if(role.id == mutedid) return
        member.removeRole(role).catch(function(e) {})
    })
    member.addRole(member.guild.roles.get(mutedid))
    
    // Write a data file in case of restarting
    client.writeDataFile('mutes', member.id, options)
}

function unmuteUser(client, id) {
    var settings = client.mutesData.get(id)
    var guild = client.guilds.get(settings.guild)
    var member = guild.members.get(id)
    client.mutesData.delete(id)
    
    // Add roles back, then removed muted role
    settings.roles.forEach(function(id) {
        var role = guild.roles.get(id)
        member.addRole(role).catch(function(e) {})
    })
    member.removeRole(member.guild.roles.get(mutedid))
    
    // Delete the mute data file (if it exists)
    try {
        fs.unlink('data/mutes/' + member.id + '.json', function(e) {})
    } catch(e) {}
    
    // Reply message
    try {
        var channel = guild.channels.get(settings.channel)
        channel.send(member.displayName + ' has been unmuted')
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
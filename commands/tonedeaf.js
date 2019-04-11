const discord = require('discord.js')

module.exports = {
    name: 'tonedeaf',
    description: '🛡 Block a user from using #music',
    execute(message, args, client) {
        if(message.guild.id != '309951255575265280') return;
        
        var user = message.member
        
        if(client.isModerator(user)) {
            try {
                var target = message.mentions.members.first()
                
                // Make sure administrators don't get muted
                if(client.isAdministrator(target)) {
                    message.channel.send('You cannot tone deaf Administrators!')
                    return
                }
                
                // Toggle the role
                var role_id = '386767348096565248'
                var role = message.guild.roles.get(role_id)
                if(target.roles.has(role_id)) {
                    target.removeRole(role)
                    message.channel.send('Gave good music taste back to ' + target.displayName)
                } else {
                    target.addRole(role)
                    message.channel.send('Made ' + target.displayName + ' tone deaf 🔇')
                }
            } catch(error) {
                // pass
            }
        } else {
            message.channel.send('You need to be a Moderator to use this.')
        }
    },
}
const discord = require('discord.js')

module.exports = {
    name: 'mute',
    description: '[🛡️]',
    execute(message, args, client) {
        if(message.guild.id != '309951255575265280') return;
        
        var user = message.member
        
        if(client.isModerator(user)) {
            try {
                var target = message.mentions.members.first()
                
                // Make sure administrators don't get muted
                if(client.isAdministrator(target)) {
                    message.channel.send('You cannot mute Administrators!')
                    return
                }
                
                // Toggle the role
                var role_id = '495945521408770049'
                var role = message.guild.roles.get(role_id)
                if(user.roles.has(role_id)) {
                    user.removeRole(role)
                    message.channel.send('Succesfully unmuted ' + target.displayName)
                } else {
                    user.addRole(role)
                    message.channel.send('Succesfully muted ' + target.displayName + ' 👋')
                }
            } catch(error) {
                // pass
            }
        } else {
            message.channel.send('You need to be a Moderator to use this.')
        }
    },
}
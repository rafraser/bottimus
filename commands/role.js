const discord = require('discord.js')

module.exports = {
    name: 'role',
    description: 'Assign a role to yourself',
    execute(message, args) {
        if(message.guild.id != '309951255575265280') return;
        
        // Handle no arguments with some help text
        if(!args.length || args.length < 1) {
            message.channel.send('Please select at least one role:```yaml\nevent\nmapping\nminecraft\nminigames```')
            return
        }
        
        var user = message.member
        var message_stack = ''
        
        // Add roles where appropiate
        // Todo: simplify this
        for(var role of args) {
            if(role.includes('event')) {
                // Assign the events related role
                var role_id = '535346825423749120'
                var role = message.guild.roles.get(role_id)
                if(user.roles.has(role_id)) {
                    user.removeRole(role)
                    message_stack += 'You won\'t get event notifications anymore. :(\n'
                } else {
                    user.addRole(role)
                    message_stack += 'Thanks for signing up for events!\n'
                }
            } else if(role.includes('map') || role.includes('hammer')) {
                // Assign the mapping related role
                var role_id = '514727746006679552'
                var role = message.guild.roles.get(role_id)
                if(user.roles.has(role_id)) {
                    user.removeRole(role)
                    message_stack += 'Sorry to see you leave #mapping :(\n'
                } else {
                    user.addRole(role)
                    message_stack += 'Welcome to #mapping!\n'
                }
            } else if(role.includes('minecraft') || role.includes('cube')) {
                // Assign the mapping related role
                var role_id = '621418889938599956'
                var role = message.guild.roles.get(role_id)
                if(user.roles.has(role_id)) {
                    user.removeRole(role)
                    message_stack += 'Sorry to see you leave #minecraft :(\n'
                } else {
                    user.addRole(role)
                    message_stack += 'Welcome to #minecraft!\n'
                }
            } else if(role.includes('mini')) {
                // Assign the mapping related role
                var role_id = '621421798478839819'
                var role = message.guild.roles.get(role_id)
                if(user.roles.has(role_id)) {
                    user.removeRole(role)
                    message_stack += 'Sorry to see you leave Minigames :(\n'
                } else {
                    user.addRole(role)
                    message_stack += 'Thanks for joining the Minigames beta!\n'
                }
            }
        }
        
        message.channel.send(message_stack)
    },
}
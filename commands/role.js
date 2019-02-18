const discord = require('discord.js')

module.exports = {
    name: 'role',
    description: 'Assign a role to yourself',
    execute(message, args) {
        if(message.guild.id != '309951255575265280') return;
        
        if(!args.length || args.length < 1) {
            message.channel.send('Please select a role:```event \nmapping```')
            return
        }
        
        var user = message.member
        
        if(args[0].includes('event')) {
            var role_id = '535346825423749120'
            var role = message.guild.roles.get(role_id)
            if(user.roles.has(role_id)) {
                user.removeRole(role)
                message.channel.send('You won\'t get event notifications anymore. :(')
            } else {
                user.addRole(role)
                message.channel.send('Thanks for signing up for events!')
            }
        } else if(args[0].includes('map')) {
            var role_id = '514727746006679552'
            var role = message.guild.roles.get(role_id)
            if(user.roles.has(role_id)) {
                user.removeRole(role)
                message.channel.send('Sorry to see you leave #mapping :(')
            } else {
                user.addRole(role)
                message.channel.send('Welcome to #mapping!')
            }
        }
    },
}
const discord = require('discord.js')

module.exports = {
    name: 'clean',
    description: '🛡️ Delete the last X messages from the channel',
    execute(message, args, client) {
        if(message.guild.id != '309951255575265280') return;
        
        var user = message.member
        
        if(client.isAdministrator(user)) {
            try {
                if(!args.length || args.length < 1) { args = ['50'] }
                var num = Math.max(parseInt(args[0], 10) + 1, 100)
                if (isNaN(num)) {
                    message.channel.send('Please use a valid number')
                    return
                }
                
                message.channel.bulkDelete(num)
            } catch(error) {
                // pass
            }
        } else {
            message.channel.send('You need to be an Administrator to use this.')
        }
    },
}
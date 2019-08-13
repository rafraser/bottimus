const discord = require('discord.js')

module.exports = {
    name: 'clean',
    description: '🛡️ Delete the last X messages from the channel',
    execute(message, args, client) {
        if(message.guild.id != '309951255575265280') return;
        
        var user = message.member
        
        if(client.isAdministrator(user)) {
            try {
                // Determine the number of messages to delete
                if(!args.length || args.length < 1) { args = ['50'] }
                var num = Math.min(parseInt(args[0], 10) + 1, 100)
                if (isNaN(num)) {
                    message.channel.send('Please use a valid number')
                    return
                }
                
                // Bulk delete has a limit of 100 - bit of a pain but oh well
                // Possible todo: expand to allow more than 100?
                message.channel.bulkDelete(num)
            } catch(error) {
                // pass
            }
        } else {
            // Command is restricted to administrators only
            message.channel.send('You need to be an Administrator to use this.')
        }
    },
}
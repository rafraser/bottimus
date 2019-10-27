const discord = require('discord.js')

module.exports = {
    name: 'clean',
    description: '🛡️ Delete the last X messages from the channel',
    aliases: ['cleanup'],
    execute(message, args, client) {
        if(message.guild.id != '309951255575265280') return
        
        if(!client.isAdministrator(message.member)) {
            message.channel.send('You need to be an Administrator to use this!')
            return
        }
        
        try {
            var num = args.shift() || 50
            num = Math.min(parseInt(num, 10) + 1, 100)
            if(isNaN(num)) return
            
            // Bulk delete has a limit of 100
            // Possible todo: expand to allow more than 100?
            message.channel.bulkDelete(num)
        } catch(e) {}
    }
}
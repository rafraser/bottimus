const discord = require('discord.js')

module.exports = {
    name: 'edit_embed',
    description: '🛡️ Edit a fancy embed',
    hidden: true,
    execute(message, args, client) {
        var user = message.member
        if(!client.isAdministrator(user)) {
            message.channel.send('You need to be an Administrator to use this.')
            return
        }
        
        var id = args.shift()
        
        // Generate the embed based on arguments
        var embed = new discord.RichEmbed()
        args.forEach(function(arg) {
            console.log(arg)
            arg = arg.split(':')
            console.log(arg)
            var key = arg[0]
            var value = arg[1]
            
            switch(key) {
                case 'color':
                    embed.setColor(value)
                    break
                case 'title':
                    embed.setTitle(value)
                    break
                case 'url':
                    embed.setURL(value)
                    break
                case 'description':
                    embed.setDescription(value)
                    break
                case 'field':
                    // Add a new field to the embed
                    value = value.split(',')
                    if(value.length < 2) {
                        embed.addField(value[0], ' ')
                    } else {
                        embed.addField(value[0], value[1])
                    }
                default:
                    break
            }
        })
        
        message.delete()
        message.channel.fetchMessage(id)
        .then(message => message.edit(embed))
    },
}
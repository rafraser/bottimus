const discord = require('discord.js')

module.exports = {
    name: 'fetchuser',
    description: 'Search a user by ID',
    execute(message, args, client) {
        var id = args[0]
        
        client.fetchUser(id).then(function(user) {
            var embed = new discord.RichEmbed()
            .setTitle(user.username)
            .setThumbnail(user.avatarURL)
            message.channel.send(embed)
        })
    },
}
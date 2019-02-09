const discord = require('discord.js')
const gamedig = require('gamedig')
const ip = '108.61.169.175'

module.exports = {
    name: 'status',
    description: 'Fetchs current server state from Simply Murder',
    execute(message, args) {
        // Query the server using gamedig
        gamedig.query({type:'garrysmod', host:ip}).then(function(result) {
            // Generate a nice looking embed
            var embed = new discord.RichEmbed()
            .setColor(43263)
            .setTitle(`${result.name}`)
            .setDescription(`Click: steam://connect/${ip} to join`)
            .addField('Players', `${result.players.length||0}/${result.maxplayers||0}`, true)
            .addField('Map', `${result.map}`, true)
            .setThumbnail(`https://fluffyservers.com/mapicons/${result.map}.jpg`)
            message.channel.send(embed)
        }).catch(function(error) {
            message.channel.send('Something went wrong. Is the server down?')
        })
    },
}
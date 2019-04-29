const discord = require('discord.js')
const gamedig = require('gamedig')
const ip = '207.148.86.197'

module.exports = {
    name: 'status',
    description: 'Fetchs current server state from Minigames',
    execute(message, args) {
        // Query the server using gamedig
        gamedig.query({type:'garrysmod', host:ip}).then(function(result) {
            // Generate a nice looking embed
            var embed = new discord.RichEmbed()
            .setColor(43263)
            .setTitle(`${result.name}`)
            .setDescription(`Click: steam://connect/${ip} to join`)
            .addField('Players', `${result.players.length||0}/${result.maxplayers||0}`, true)
            .addField('Playing', `${result.raw.game} on ${result.map}`, true)
            .setThumbnail(`https://fluffyservers.com/mg/maps/${result.map}.jpg`)
            message.channel.send(embed)
        }).catch(function(error) {
            message.channel.send('Something went wrong. Is the server down?')
        })
    },
}
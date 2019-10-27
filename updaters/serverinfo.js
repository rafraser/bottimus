const gamedig = require('gamedig')
const discord = require('discord.js')

function updateMurder(message) {
    const ip = '108.61.169.175'
    gamedig.query({type:'garrysmod', host:ip}).then(function(result) {
        // Generate a nice looking embed
        var embed = new discord.RichEmbed()
        .setColor('#e84118')
        .setTitle(`🕹️ Murder`)
        .setDescription(`Click: steam://connect/${ip} to join`)
        .addField('Players', `${result.players.length||0}/${result.maxplayers||0}`, true)
        .addField('Map', `${result.map}`, true)
        .setThumbnail(`https://fluffyservers.com/mapicons/${result.map}.jpg`)
        .setTimestamp()
        message.edit(embed)
    })
}

function updateMinigames(message) {
    const ip = '139.180.168.161'
    gamedig.query({type:'garrysmod', host:ip}).then(function(result) {
        // Generate a nice looking embed
        var embed = new discord.RichEmbed()
        .setColor('#fbc531')
        .setTitle(`🕹️ Minigames`)
        .setDescription(`Click: steam://connect/${ip} to join`)
        .addField('Players', `${result.players.length||0}/${result.maxplayers||0}`, true)
        .addField('Playing', `${result.raw.game} on ${result.map}`, true)
        .setThumbnail(`https://fluffyservers.com/mg/maps/${result.map}.jpg`)
        .setTimestamp()
        message.edit(embed)
    })
}

function updateMinecraft(message) {
    const ip = '139.180.168.161'
    gamedig.query({type:'minecraft', host:ip}).then(function(result) {
        // Generate a nice looking embed
        var embed = new discord.RichEmbed()
        .setColor('#44bd32')
        .setTitle(`🕹️ Minecraft`)
        .setDescription(`Map: http://139.180.168.161:8123`)
        .addField('Players', `${result.players.length||0}/${result.maxplayers||0}`, true)
        .addField('IP', '139.180.168.161', true)
        .setThumbnail(`https://fluffyservers.com/img/minecraft.png`)
        .setTimestamp()
        message.edit(embed)
    })
}

const serverChannel = '528849382196379650'
const murderMessage = '584979182459813889'
const minigamesMessage = '584979191121051659'
//const minecraftMessage = '621400728321392641'

module.exports = {
    description: 'Update the server information in the welcome channel',
    frequency: 5,
    execute(client) {
        try{
            var channel = client.channels.get(serverChannel)
            channel.fetchMessage(murderMessage).then(function(m) { updateMurder(m) })
            channel.fetchMessage(minigamesMessage).then(function(m) { updateMinigames(m) })
            //channel.fetchMessage(minecraftMessage).then(function(m) { updateMinecraft(m) })
        } catch(e) {
            console.log('Failed to update server info')
        }
    }
}
const fs = require('fs')
const discord = require('discord.js')
const client = new discord.Client()
const gamedig = require('gamedig')
const prefix = '!'

// Load configuration from .env
// This stops me accidentally uploading my API key
require('dotenv').config()

// Load commands from file
client.commands = new discord.Collection()
var files = fs.readdirSync('./commands')
for (var file of files) {
    var command = require('./commands/' + file)
    client.commands.set(command.name, command)
}

// Load scanners from file
client.scanners = []
var files = fs.readdirSync('./scanners')
for (var file of files) {
    var scanner = require('./scanners/' + file)
    client.scanners.push(scanner)
}

// Create a collection of cooldowns
// is this actually used
client.cooldowns = new Map()

// Cool console logging when the bot connects
client.on('ready', function() {
    console.log('Logged into Discord successfully')
    
    // Start the status update loop
    client.updateServers()
    setInterval(client.updateServers, 60 * 5 * 1000)
})

// Process each message
client.on('message', function(message) {
    // Don't respond to bots oh boy that's a disaster
    if (message.author.bot) return
    
    // Scanners are applied to every single message
    // This is for stuff like word detection or reacting to a certain user etc.
    for(var scanner of client.scanners) {
        try {
            scanner.execute(message, client)
        } catch (error) { }
    }
    
    // Handle and seperate args (if applicable)
    // This seperates on spaces and quotes like expected
    // Don't ask what the regex does because I've forgotten
    if (!message.content.startsWith(prefix)) return
    var args = message.content.slice(prefix.length)
    args = args.match(/\w+|"[^"]+"/g)
	var i = args.length
    while(i--){
        args[i] = args[i].replace(/"/g,"")
    }
    
    // Make sure the command exists
    const cmd = args.shift().toLowerCase()
    if (!client.commands.has(cmd)) {
        //message.reply('Command not recognized')
        console.log(`Tried to use non-existent command, ${cmd}`)
        return
    }
    
    // Verify cooldowns for certain commands
    // Remember: Date.now uses milliseconds
    if (client.commands.get(cmd).cooldown) {
        var next_usage = client.cooldowns.get(cmd);
        if (next_usage) {
            // Check that we're within the cooldown
            if (next_usage > Date.now()) {
                message.channel.send(`Cooldown! Try again in ${Math.floor((next_usage - Date.now()) / 1000)} seconds.`)
                return
            }
        }
        client.cooldowns.set(cmd, Date.now() + client.commands.get(cmd).cooldown*1000)
    }
    
    // Execute the command
    // Terrible try-catch I know but it'll hopefully stop unexpected crashes
    try {
        client.commands.get(cmd).execute(message, args, client)
    } catch (error) {
        message.channel.send('Something went wrong.')
        message.channel.send(error.message)
    }
})

// Login to the bot with the key in .env
client.login(process.env.DISCORD)

// Permission checking command
client.isAdministrator = function(user) {
    return (user.roles.has('309952512331612160') || user.roles.has('309956347309326336'))
}

client.isModerator = function(user) {
    return user.roles.has('374893960729985035')
}

client.updateServers = function() {
    console.log('Updating servers')
    var channel = client.channels.get('528849382196379650')
    var murderID = '584979182459813889'
    var minigamesID = '584979191121051659'
    var minecraftID = '621400728321392641'
    
    // Update Murder
    channel.fetchMessage(murderID)
    .then(message => client.updateGameMurder(message))
    // Update Minigames
    channel.fetchMessage(minigamesID)
    .then(message => client.updateGameMinigames(message))
    // Update Minecraft
    channel.fetchMessage(minecraftID)
    .then(message => client.updateGameMinecraft(message))
}

// Commands to update game server status
client.updateGameMurder = function(message) {
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

client.updateGameMinigames = function(message) {
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

client.updateGameMinecraft = function(message) {
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
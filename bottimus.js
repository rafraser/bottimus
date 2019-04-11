const fs = require('fs')
const discord = require('discord.js')
const client = new discord.Client()
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
client.cooldowns = new discord.Collection()

// Cool console logging when the bot connects
client.on('ready', function() {
    console.log('Logged into Discord successfully')
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
    return (user.roles.has('309956593498456065') || user.roles.has('374893614515486721'))
}
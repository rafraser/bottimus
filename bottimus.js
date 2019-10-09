const fs = require('fs')
const discord = require('discord.js')

// Create a new Discord client
const client = new discord.Client()
const prefix = '!'

// Load the configuration from the .env file
require('dotenv').config()

// Command loading function
client.loadCommands = function() {
    client.commands = new discord.Collection()
    client.cooldowns = new Map()
    
    for(var file of fs.readdirSync('./commands')) {
        var command = require('./commands/' + file)
        client.commands.set(command.name, command)
    }
}

// Scanner loading function
client.loadScanners = function() {
    client.scanners = []
    
    for(var file of fs.readdirSync('./scanners')) {
        client.scanners.push(require('./scanners/' + file))
    }
}

// Updater loading function
client.loadUpdaters = function() {
    client.updaters = []
}

// Run all startup commands
client.loadStartup = function() {
    for(var file of fs.readdirSync('./startup')) {
        require('./startup/' + file).execute()
    }
}

client.update = function() {
    // Run every updating function as required
    for(var update of client.updaters) {
        if((client.minute % update.frequency) == 0) {
            update.execute(client)
        }
    }
    
    // Increment the minute by one up to a maximum of an hour
    client.minute = (client.minute + 1) % 60
}

// Load all the required functionality when the bot is connected
client.on('ready', function() {
    console.log('Connected to Discord successfully')
    
    // Load all required files
    client.loadCommands()
    client.loadScanners()
    client.loadUpdaters()
    
    // Run startup files
    client.loadStartup()
    client.user.setActivity('Bottimus2 Beta')
    
    // Start the update loop
    client.minute = 0
    setInterval(client.update, 60 * 1000)
})

// Command handler
client.on('message', function(message) {
    // Do not handle messages by bots
    if(message.author.bot) return
    
    // Scanners are applied to every message
    // This can be used to stop messages from sending
    for(var scanner of client.scanners) {
        try {
            // Run the scanner
            var result = scanner.execute(message, client)
            
            // Abort processing if a scanner returns false
            if(result == false) {
                return
            }
        } catch(error) {}
    }
    
    // Check for commands
    if(!message.content.startsWith(prefix)) return
    
    // Handle args
    // This uses a scary regex to split the arguments up
    // Don't worry! It's not that bad!
    // The first half finds words not seperated by spaces
    // The second half finds groups of words inside quotes
    var args = message.content.slice(prefix.length)
    args = args.match(/[^" \n]+|"[^"]+"/g)
    
    // Check the command name
    var cmd = args.shift().toLowerCase()
    if(!client.commands.has(cmd)) return
    
    // Execute the command
    // Includes some terrible error handling!
    try {
        client.commands.get(cmd).execute(message, args, client)
    } catch(error) {
        message.channel.send(error.message)
    }
})

// Start the bot
client.login(process.env.DISCORD)

// Helper utility functions
client.isAdministrator = function(member) {
    if(this.isModerator(member)) {
        return true
    } else {
        if(member.roles.some(function(role) {
            role.name.endsWith('Administrator')
        })){
            return true
        } else {
            return false
        }
    }
}

client.isModerator = function(member) {
    if(member.roles.some(function(role) {
        return role.name.endsWith('Moderator')
    })){
        return true
    } else {
        return false
    }
}

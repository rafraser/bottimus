const fs = require('fs')
const discord = require('discord.js')
const spawn = require('child_process').spawn

// Create a new Discord client
const client = new discord.Client()
const prefix = '!'

// Load the configuration from the .env file
require('dotenv').config()

// Create the directories for submodules if they don't exist
client.createDirectories = function() {
    var directories = ['commands', 'scanners', 'updaters', 'startup', 'data']
    for(var directory of directories) {
        if(!fs.existsSync(directory)) {
            fs.mkdirSync(directory)
        }
    }
}

// Helper function for writing a .json file
client.writeDataFile = function(directory, name, data) {
    // Create the data subfolder if it doesn't already exist
    if(!fs.existsSync('data/' + directory)) {
        fs.mkdirSync('data/' + directory)
    }
    
    // Convert the data to JSON and write to the data file
    fs.writeFile('data/' + directory + '/' + name + '.json', JSON.stringify(data), function(e) {
        if(e) console.error(e)
    })
}

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
    
    for(var file of fs.readdirSync('./updaters')) {
        client.updaters.push(require('./updaters/' + file))
    }
}

// Run all startup commands
client.loadStartup = function() {
    for(var file of fs.readdirSync('./startup')) {
        require('./startup/' + file).execute(client)
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
    client.createDirectories()
    client.loadCommands()
    client.loadScanners()
    client.loadUpdaters()
    
    // Run startup files
    client.loadStartup()
    
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
    if(member.roles.some(function(role) {
        return role.name.endsWith('Administrator')
    })){
        return true
    } else {
        return false
    }
}

client.isModerator = function(member) {
    if(client.isAdministrator(member)) return true
    
    if(member.roles.some(function(role) {
        return role.name.endsWith('Moderator')
    })){
        return true
    } else {
        return false
    }
}

// Helper utility function to find a user
client.findUser = function(message, args, retself=False) {
    // Return mentioned user if any were in the message
    if(message.mentions.members.size >= 1) {
        return message.mentions.members.first()
    }
    
    // Handle case with 0 arguments
    if(!args || args.length < 1) {
        if(retself) {
            return message.member
        } else {
            throw new Error('No user found!')
        }
    }
    
    // Search the list of users for matching names
    var search = args.shift()
    var results = message.guild.members.filter(function(u) {
        return u.displayName.includes(search)
    })
    
    // Return results or raise an error
    if(results.size > 1) {
        throw new Error('More than one user matched!')
    } else if(results.size < 1) {
        if(retself) {
            return message.member
        } else {
            throw new Error('No user found!')
        }
    } else {
        return results.first()
    }
}

// Execute a given python script
client.executePython = function(script, args) {
    if(!Array.isArray(args)) {
        args = [args]
    }
    args.unshift('python/' + script + '.py')
    
    var p = new Promise(function(resolve, reject) {
        var python = spawn('python3', args)
        var data = ''
        
        // Log print statements and errors to the data
        python.stdout.on('data', function(d) {
            data += d
        })
        
        python.stderr.on('data', function(d) {
            data += d
        })
        
        // Resolve or reject the promise depending on the result of the python code
        // 0 is a success, any other code is a failure
        python.on('close', function(code) {
            if(code == 0) {
                resolve(data)
            } else {
                reject(data)
            }
        })
    })
    return p
}
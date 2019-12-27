const fs = require('fs')
const discord = require('discord.js')
const spawn = require('child_process').spawn

// Create a new Discord client
const client = new discord.Client()
const prefixes = ['!', 'Bottimus, ']

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
        
        // Link aliases
        if(command.aliases) {
            for(var alias of command.aliases) {
                client.commands.set(alias, command)    
            }
        }
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
    
    // Run a quick check to see if this is a test bot
    // Testing mode is enabled if a .testmode file exists
    fs.access('.testmode', fs.constants.F_OK, function(err) {
        client.testingMode = !err
        console.log('Testing Mode: ' + client.testingMode)
    })
    
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
    // This supports multiple prefixes now
    var isCommand = false
    var args
    for(var prefix of prefixes) {
        if(message.content.startsWith(prefix)) {
            isCommand = true
            args = message.content.slice(prefix.length)
            break
        }
    }
    if(!isCommand) return false
    
    // Handle args
    // This uses a scary regex to split the arguments up
    // Don't worry! It's not that bad!
    // The first half finds words not seperated by spaces
    // The second half finds groups of words inside quotes
    args = args.match(/[^"“” \n]+|["“][^"”]+["”]/g)

    // Strip any quotes at the start and end of an argument
    args = args.map(a => a.replace(/^["“]|["”]$/g, ''))

    // Check the command name
    var cmd = args.shift().toLowerCase()
    if(!client.commands.has(cmd)) return
    
    // Check for cooldowns
    var command = client.commands.get(cmd)
    if(command.cooldown) {
        var user = message.member.id
        if(client.cooldowns.get(cmd)) {
            var cools = client.cooldowns.get(cmd)
            if(cools.has(user)) {
                var elapsed = Date.now() - cools.get(user)
                
                // Cooldown is still active: send a warning message
                if(elapsed < command.cooldown * 1000) {
                    var timeleft = (command.cooldown * 1000) - elapsed
                    message.channel.send('Slow down! Try again in ' + client.timeToString(timeleft))
                    return
                }
            }
        } else {
            client.cooldowns.set(cmd, new Map())
        }
        
        client.cooldowns.get(cmd).set(user, Date.now())
    }
    
    // Execute the command
    // Includes some terrible error handling!
    try {
        command.execute(message, args, client)
    } catch(error) {
        message.channel.send(error.message)
    }
})

// Greet new users to the server
// Welcome new users
client.on('guildMemberAdd', function(member) {
    if(member.guild.id != '309951255575265280') return
    if(client.testingMode) return
    
    var chan = member.guild.channels.find(ch => ch.name === 'general')
    chan.send(`Welcome to Fluffy Servers, ${member.displayName}! Please check out <#528849382196379650>`)
    member.addRole('535346825423749120')
})

// Log any deleted messages into a moderation logging channel
client.on('messageDelete', function(message) {
    if(message.guild.id != '309951255575265280') return
    if(client.testingMode) return
    if(message.member.user.bot) return
    if(message.channel.name === 'bottimus') return
    
    var channel = message.guild.channels.find(ch => ch.name === 'junkyard')
    
    // todo: fix this to work for messages with multiple attachments
    // Not sure if this is even possible; but it's a real pain to deal with
    var attachment = message.attachments.first()
    if(attachment) {
        channel.send(`Deleted message by **${message.member.displayName}** in **#${message.channel.name}**:\n${message.cleanContent}`, {files: [attachment.proxyURL]})
    } else {
        channel.send(`Deleted message by **${message.member.displayName}** in **#${message.channel.name}**:\n${message.cleanContent}`)
    }
    
})

// Start the bot
client.login(process.env.DISCORD)

// Helper utility functions
client.timeToString = function(ms) {
    // Determine number and units
    var time = [1, 'second']
    if(ms < 1000) {
        time = [1, 'second']
    } else if(ms < 60 * 1000) {
        time = [Math.floor(ms/1000), 'second']
    } else if(ms < 3600 * 1000) {
        time = [Math.floor(ms/(60 * 1000)), 'minute']
    } else if(ms < 24 * 3600 * 1000) {
        time = [Math.floor(ms/(3600 * 1000)), 'hour']
    } else {
        time = [Math.floor(ms/(24 * 3600 * 1000)), 'day']
    }

    // Plurals
    if(time[0] > 1) {
        return time[0] + ' ' + time[1] + 's'
    } else {
        return time[0] + ' ' + time[1]
    }
}

// Check for Administrator status
client.isAdministrator = function(member) {
    if(member.guild.id != '309951255575265280') return false
    
    if(member.roles.some(function(role) {
        return role.name.endsWith('Administrator')
    })){
        return true
    } else {
        return false
    }
}

// Check for Moderator status
client.isModerator = function(member) {
    if(member.guild.id != '309951255575265280') return false
    if(client.isAdministrator(member)) return true
    
    if(member.roles.some(function(role) {
        return role.name.endsWith('Moderator')
    })){
        return true
    } else {
        return false
    }
}

// Check for Community Star status
client.isCommunityStar = function(member) {
    if(member.guild.id != '309951255575265280') return false
    if(client.isModerator(member)) return true
    
    if(member.roles.some(function(role) {
        return role.name.endsWith('Community Star')
    })){
        return true
    } else {
        return false
    }
}

// Helper utility function to find a user
client.findUser = function(message, args, retself=false) {
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
    var search = args.shift().toLowerCase()
    var results = message.guild.members.filter(function(u) {
        return u.displayName.toLowerCase().includes(search) || u.user.username.toLowerCase().includes(search)
    })
    
    // Return results or raise an error
    // In the event no user was found, shove the argument back on the list
    if(results.size > 1) {
        throw new Error('More than one user matched!')
    } else if(results.size < 1) {
        if(retself) {
            args.unshift(search)
            return message.member
        } else {
            args.unshift(search)
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
            data = data.trim() // remove any whitespace at the end
            if(code == 0) {
                resolve(data)
            } else {
                reject(data)
            }
        })
    })
    return p
}
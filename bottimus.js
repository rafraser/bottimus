const fs = require('fs')
const discord = require('discord.js')
const spawn = require('child_process').spawn
const timeHelper = require('./util/timehelper')
const handlerSetup = require('./util/handler_setup')

// Create a new Discord client
const client = new discord.Client()
const prefixes = ['!', 'Bottimus, ']

// Load the configuration from the .env file
require('dotenv').config()

// Helper function for writing a .json file
client.writeDataFile = function (directory, name, data) {
  // Create the data subfolder if it doesn't already exist
  if (!fs.existsSync('data/' + directory)) {
    fs.mkdirSync('data/' + directory)
  }

  // Convert the data to JSON and write to the data file
  fs.writeFile('data/' + directory + '/' + name + '.json', JSON.stringify(data), function (e) {
    if (e) console.error(e)
  })
}

client.update = function () {
  // Run every updating function as required
  for (const update of client.updaters) {
    if ((client.minute % update.frequency) === 0) {
      update.execute(client)
    }
  }

  // Increment the minute by one up to a maximum of an hour
  client.minute = (client.minute + 1) % 60
}

// Load all the required functionality when the bot is connected
client.on('ready', function () {
  // Initialise important directories
  handlerSetup.createDirectories()

  // Run a quick check to see if this is a test bot
  // Testing mode is enabled if a .testmode file exists
  fs.access('.testmode', fs.constants.F_OK, function (err) {
    client.testingMode = !err

    // Setup logging
    if (!client.testingMode) {
      let logFile = fs.createWriteStream(`logs/${Date.now()}.txt`)
      process.stdout.write = process.stderr.write = logFile.write.bind(logFile)
    }

    console.log('Connected to Discord successfully')
    console.log('Testing Mode: ' + client.testingMode)
  })

  // Start initialisation
  handlerSetup.setup(client)

  // Start the update loop
  client.minute = 0
  setInterval(client.update, 60 * 1000)
})

// Command handler
client.on('message', function (message) {
  // Do not handle messages by bots
  if (message.author.bot) return

  // Scanners are applied to every message
  // This can be used to stop messages from sending
  for (const scanner of client.scanners) {
    try {
      // Run the scanner
      const result = scanner.execute(message, client)

      // Abort processing if a scanner returns false
      if (result === false) {
        return
      }
    } catch (error) { }
  }

  // Check for commands
  // This supports multiple prefixes now
  let isCommand = false
  let args
  for (const prefix of prefixes) {
    if (message.content.startsWith(prefix)) {
      isCommand = true
      args = message.content.slice(prefix.length)
      break
    }
  }
  if (!isCommand) return false

  // Handle args
  // This uses a scary regex to split the arguments up
  // Don't worry! It's not that bad!
  // The first half finds words not seperated by spaces
  // The second half finds groups of words inside quotes
  args = args.match(/[^"“” \n]+|["“][^"”]+["”]/g)

  // Strip any quotes at the start and end of an argument
  args = args.map((a) => a.replace(/^["“]|["”]$/g, ''))

  // Check the command name
  const cmd = args.shift().toLowerCase()
  if (!client.commands.has(cmd)) return
  const command = client.commands.get(cmd)

  // Check for guild restrictions
  const guild = message.channel.guild.id
  if (command.guilds) {
    if (!command.guilds.includes(guild)) return
  }

  // Check for cooldowns
  if (command.cooldown) {
    const user = message.member.id
    if (client.cooldowns.get(cmd)) {
      const cools = client.cooldowns.get(cmd)
      if (cools.has(user)) {
        const elapsed = Date.now() - cools.get(user)

        // Cooldown is still active: send a warning message
        if (elapsed < command.cooldown * 1000) {
          const timeleft = (command.cooldown * 1000) - elapsed
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
  } catch (error) {
    message.channel.send(error.message)
  }
})

// Welcome new users to the server where applicable
client.on('guildMemberAdd', function (member) {
  if (client.testingMode) return

  const guild = member.guild.id
  if (client.welcomes.has(guild)) {
    client.welcomes.get(guild)(member)
  }
})

// Log any deleted messages into a moderation logging channel
client.on('messageDelete', function (message) {
  if (message.guild.id !== '309951255575265280') return
  if (client.testingMode) return
  if (message.member.user.bot) return
  if (message.channel.name === 'bottimus') return
  if (message.channel.name === 'administration') return
  if (message.channel.name === 'bottimus-test-track') return
  if (message.content.startsWith('!say')) return

  const channel = message.guild.channels.find((ch) => ch.name === 'junkyard')

  // todo: fix this to work for messages with multiple attachments
  // Not sure if this is even possible; but it's a real pain to deal with
  const attachment = message.attachments.first()
  if (attachment) {
    channel.send(`Deleted message by **${message.member.displayName}** in **#${message.channel.name}**:\n${message.cleanContent}`, { files: [attachment.proxyURL] })
  } else {
    channel.send(`Deleted message by **${message.member.displayName}** in **#${message.channel.name}**:\n${message.cleanContent}`)
  }
})

// Start the bot
client.login(process.env.DISCORD)

// Helper utility functions
client.timeToString = timeHelper.timeToString

// Check for Administrator status
client.isAdministrator = function (member) {
  const roleData = client.serverRoles.get(member.guild.id)
  if (!roleData) return false
  if (!roleData.admin) return false

  return member.roles.some(role => {
    return role.name.endsWith(roleData.admin)
  })
}

// Check for Moderator status
client.isModerator = function (member) {
  if (client.isAdministrator(member)) return true

  const roleData = client.serverRoles.get(member.guild.id)
  if (!roleData) return false
  if (!roleData.mod) return false

  return member.roles.some(role => {
    return role.name.endsWith(roleData.mod)
  })
}

// Check for Community Star status
// This function is *only* used in Fluffy Servers
// so we can safely hard code some guild checking stuff
client.isCommunityStar = function (member) {
  if (member.guild.id !== '309951255575265280') return false
  if (client.isModerator(member)) return true

  return member.roles.some(role => {
    return role.name.endsWith('Community Star')
  })
}

// Useful function to get a channel with a default case for testing mode
client.channelWithTesting = function (channel) {
  const testing = '583635933585342466'
  const channelID = client.testingMode ? testing : channel
  return client.channels.get(channelID)
}

// Helper utility function to find a user
client.findUser = function (message, args, retself = false) {
  // Return mentioned user if any were in the message
  if (message.mentions.members.size >= 1) {
    return message.mentions.members.first()
  }

  // Handle case with 0 arguments
  if (!args || args.length < 1) {
    if (retself) {
      return message.member
    } else {
      throw new Error('No user found!')
    }
  }

  // Search the list of users for matching names
  const search = args.shift().toLowerCase()
  const results = message.guild.members.filter(function (u) {
    return u.displayName.toLowerCase().includes(search) || u.user.username.toLowerCase().includes(search)
  })

  // Return results or raise an error
  // In the event no user was found, shove the argument back on the list
  if (results.size > 1) {
    throw new Error('More than one user matched!')
  } else if (results.size < 1) {
    if (retself) {
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
client.executePython = function (script, args) {
  if (!Array.isArray(args)) {
    args = [args]
  }
  args.unshift('python/' + script + '.py')

  const p = new Promise(function (resolve, reject) {
    const python = spawn('python3', args)
    let data = ''

    // Log print statements and errors to the data
    python.stdout.on('data', function (d) {
      data += d
    })

    python.stderr.on('data', function (d) {
      data += d
    })

    // Resolve or reject the promise depending on the result of the python code
    // 0 is a success, any other code is a failure
    python.on('close', function (code) {
      data = data.trim() // remove any whitespace at the end
      if (code === 0) {
        resolve(data)
      } else {
        reject(data)
      }
    })
  })
  return p
}

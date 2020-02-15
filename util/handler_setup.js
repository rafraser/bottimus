const fs = require('fs')
const discord = require('discord.js')

// Scanner loading function
function loadScanners(client) {
  client.scanners = []

  fs.readdir('./handlers/scanners', (err, files) => {
    if (err) {
      console.error(err)
      return
    }

    for (const file of files) {
      client.scanners.push(require('../handlers/scanners/' + file))
    }
  })
}

// Updater loading function
function loadUpdaters(client) {
  client.updaters = []

  fs.readdir('./handlers/updaters', (err, files) => {
    if (err) {
      console.error(err)
      return
    }

    for (const file of files) {
      client.updaters.push(require('../handlers/updaters/' + file))
    }
  })
}

// Setup welcome messages
function loadWelcome(client) {
  client.welcomes = new discord.Collection()

  fs.readdir('./handlers/welcome', (err, files) => {
    if (err) {
      console.error(err)
      return
    }

    for (const file of files) {
      client.welcomes.set(file.replace('.js', ''), require('../handlers/welcome/' + file))
    }
  })
}

// Run all startup commands
function loadStartup(client) {
  fs.readdir('./handlers/startup', (err, files) => {
    if (err) {
      console.error(err)
      return
    }

    for (const file of files) {
      require('../handlers/startup/' + file).execute(client)
    }
  })
}

function loadCommands(client) {
  client.commands = new discord.Collection()
  client.cooldowns = new Map()

  fs.readdir('./commands', (err, files) => {
    if (err) {
      console.error(err)
      return
    }

    for (const file of files) {
      const command = require('../commands/' + file)
      client.commands.set(command.name, command)

      // Link aliases
      if (command.aliases) {
        for (const alias of command.aliases) {
          client.commands.set(alias, command)
        }
      }
    }
  })
}

function errorHandler(e) {
  if (e) {
    console.err(e)
  }
}

// Create useful directories
module.exports.createDirectories = function () {
  fs.mkdir('commands', { recursive: true }, errorHandler)
  fs.mkdir('data', { recursive: true }, errorHandler)
  fs.mkdir('logs', { recursive: true }, errorHandler)

  fs.mkdir('handlers/scanners', { recursive: true }, errorHandler)
  fs.mkdir('handlers/updaters', { recursive: true }, errorHandler)
  fs.mkdir('handlers/startup', { recursive: true }, errorHandler)
  fs.mkdir('handlers/welcome', { recursive: true }, errorHandler)
}

module.exports.setup = function (client) {
  loadScanners(client)
  loadUpdaters(client)
  loadWelcome(client)
  loadStartup(client)
  loadCommands(client)
}

const fs = require('fs')
const discord = require('discord.js')

// Scanner loading function
function loadScanners(client) {
  client.scanners = []

  for (const file of fs.readdirSync('./handlers/scanners')) {
    client.scanners.push(require('../handlers/scanners/' + file))
  }
}

// Updater loading function
function loadUpdaters(client) {
  client.updaters = []

  for (const file of fs.readdirSync('./handlers/updaters')) {
    client.updaters.push(require('../handlers/updaters/' + file))
  }
}

// Setup welcome messages
function loadWelcome(client) {
  client.welcomes = new discord.Collection()
  for (const file of fs.readdirSync('./handlers/welcome')) {
    client.welcomes.set(file.replace('.js', ''), require('../handlers/welcome/' + file))
  }
}

// Run all startup commands
function loadStartup(client) {
  for (const file of fs.readdirSync('./handlers/startup')) {
    require('../handlers/startup/' + file).execute(client)
  }
}

module.exports.setup = function (client) {
  loadScanners(client)
  loadUpdaters(client)
  loadWelcome(client)
  loadStartup(client)
}

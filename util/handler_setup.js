const fs = require('fs')

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

// Run all startup commands
function loadStartup(client) {
  for (const file of fs.readdirSync('./handlers/startup')) {
    require('../handlers/startup/' + file).execute(client)
  }
}

module.exports.setup = function (client) {
  loadScanners(client)
  loadUpdaters(client)
  loadStartup(client)
}

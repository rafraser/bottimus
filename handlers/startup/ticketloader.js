const discord = require('discord.js')
const fs = require('fs')

module.exports = {
  description: 'Loads any stored ticket data into the immediate memory',
  execute(client) {
    client.ticketData = new discord.Collection()
    try {
      fs.readdir('data/tickets/', function (err, files) {
        if (err || !files) {
          return
        }

        for (let ticket of files) {
          // Load each ticket data file
          fs.readFile('data/tickets/' + ticket, function (err, data) {
            if (err) return

            const id = ticket.replace('.json', '')
            data = JSON.parse(data)
            data.revoke = new Date(data.revoke)
            client.ticketData.set(id, data)
          })
        }
      })
    } catch (e) { }
  }
}

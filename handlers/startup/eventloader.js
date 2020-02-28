const discord = require('discord.js')
const fs = require('fs')

module.exports = {
  description: 'Loads any stored event data into the immediate memory',
  execute(client) {
    client.eventsData = new discord.Collection()
    try {
      fs.readdir('data/events/', function (err, files) {
        if (err || !files) {
          return
        }

        for (const event of files) {
          // Load each event data file
          fs.readFile('data/events/' + event, function (err, data) {
            if (err) return

            const id = event.replace('.json', '')
            data = JSON.parse(data)
            data.time = new Date(data.time)
            if (Date.now() > data.time) {
              data.complete = true
              if (Date.now() - (1000 * 3600 * 24 * 32) > data.time) {
                // Delete any events older than 32 days
                try {
                  fs.unlink('data/events/' + event, function (e) { })
                } catch (e) { }
              }
            }
            client.eventsData.set(id, data)
          })
        }
      })
    } catch (e) { }
  }
}

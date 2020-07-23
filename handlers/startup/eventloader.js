const discord = require('discord.js')
const fs = require('fs')
const events = require('../../util/events')

function loadEvent(client, event, data) {
  const id = event.replace('.json', '')
  data = JSON.parse(data)

  // Parse the date
  data.time = new Date(data.time)
  if (Date.now() > data.time) {
    data.complete = true
    if (Date.now() - (1000 * 3600 * 24 * 32) > data.time) {
      // Delete any events older than 32 days
      try {
        fs.unlink('data/events/' + event, console.error)
      } catch (e) { }
    }
  }

  // Legacy code to handle events created before the global update
  // This should be removed on approximately September 1st
  // if you're looking at this comment in 2021 i'm a disappointment
  if (!data.guild) {
    data.guild = '309951255575265280'
  }

  const guildEvents = events.getGuildEvents(client, data.guild)
  guildEvents.set(id, data)
}

module.exports = {
  description: 'Loads any stored event data into the immediate memory',
  execute(client) {
    client.eventsData = new discord.Collection()
    try {
      fs.readdir('data/events/', (err, files) => {
        if (err || !files) {
          return
        }

        for (const event of files) {
          // Load each event data file
          fs.readFile('data/events/' + event, (err, data) => {
            if (err) return
            loadEvent(client, event, data)
          })
        }

      })
    } catch (e) { }
  }
}

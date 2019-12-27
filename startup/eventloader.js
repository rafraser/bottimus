const discord = require('discord.js')
const fs = require('fs')

module.exports = {
    description: 'Loads any stored event data into the immediate memory',
    execute(client) {
        client.eventsData = new discord.Collection()
        try {
            fs.readdir('data/events/', function(err, files) {
                if(!files) return
                
                for(var event of files) {
                    // Load each event data file
                    fs.readFile('data/events/' + event, function(err, data) {
                        if(err) return
                        
                        var id = event.replace('.json', '')
                        data = JSON.parse(data)
                        data.time = new Date(data.time)
                        client.eventsData.set(id, data)
                    })
                }
            })
        } catch(e) {}
    }
}
const discord = require('discord.js')
const fs = require('fs')

module.exports = {
    description: 'Loads any stored mute data into the immediate memory',
    execute(client) {
        client.mutesData = new discord.Collection()
        try {
            fs.readdir('data/mutes/', function(err, files) {
                for(var mute of files) {
                    // Load each mute data file
                    fs.readFile('data/mutes/' + mute, function(err, data) {
                        if(err) return
                        
                        var id = mute.replace('.json', '')
                        data = JSON.parse(data)
                        data.unmute = new Date(data.unmute)
                        client.mutesData.set(id, data)
                    })
                }
            })
        } catch(e) {}
    }
}
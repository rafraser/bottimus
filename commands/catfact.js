const discord = require('discord.js');
const https = require('https')

module.exports = {
    name: 'catfact',
    description: 'Get a random cat fact',
    execute(message, args) {
        var url = 'https://catfact.ninja/fact'
        
        https.get(url, function(resp) {
            data = '';
            
            resp.on('data', function(chunk) {
                data += chunk;
            })
            
            resp.on('end', function() {
                var fact = JSON.parse(data)['fact']
                message.channel.send(fact)
            })
        })
    },
};
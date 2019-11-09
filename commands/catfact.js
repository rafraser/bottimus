const discord = require('discord.js');
const https = require('https')

module.exports = {
    name: 'catfact',
    description: 'Get a random cat fact',
    cooldown: 10,
    execute(message, args) {
        var url = 'https://catfact.ninja/fact'
        
        https.get(url, function(resp) {
            data = '';
            
            resp.on('data', function(chunk) {
                data += chunk;
            })
            
            resp.on('end', function() {
                var fact = JSON.parse(data)['fact']
                
                var embed = new discord.RichEmbed()
                .setColor('#9c88ff')
                .setDescription(fact)
                message.channel.send(embed)
            })
        })
    },
};
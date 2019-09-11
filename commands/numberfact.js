const discord = require('discord.js');
const http = require('http')

module.exports = {
    name: 'numberfact',
    description: 'Get a random number fact',
    execute(message, args) {
        var url
        if(Math.random() < 0.2) {
            url = 'http://numbersapi.com/random/trivia'
        } else {
            url = 'http://numbersapi.com/random/math'
        }
        
        http.get(url, function(resp) {
            data = '';
            
            resp.on('data', function(chunk) {
                data += chunk;
            })
            
            resp.on('end', function() {
                data = data.split(' ')
                var number = data.shift()
                var description = data.join(' ')
                
                var embed = new discord.RichEmbed()
                .setColor('#9c88ff')
                .setTitle(number)
                .setDescription(description)
                message.channel.send(embed)
            })
        })
    },
};
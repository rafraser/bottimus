const discord = require('discord.js');
const http = require('http')

module.exports = {
    name: 'numberfact',
    description: 'Get a random number fact',
    execute(message, args) {
        var url
        
        // Get the url to search
        if(args.length >= 1 && !isNaN(args[0])) {
            if(Math.random() < 0.8) {
                url = 'http://numbersapi.com/' + args[0] + '/trivia'
            } else {
                url = 'http://numbersapi.com/' + args[0] + '/math'
            }
        } else {
            if(Math.random() < 0.8) {
                url = 'http://numbersapi.com/random/trivia'
            } else {
                url = 'http://numbersapi.com/random/math'
            }
        }
        
        http.get(url, function(resp) {
            data = '';
            
            resp.on('data', function(chunk) {
                data += chunk;
            })
            
            resp.on('end', function() {
                data = data.split(' ')
                var number = data.shift()
                if(isNaN(number)) {
                    message.channel.send('Something went wrong fetching a number fact.')
                    return
                }
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
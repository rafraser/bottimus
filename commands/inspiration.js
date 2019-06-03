const https = require('https');
const discord = require('discord.js');

require('dotenv').config()

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

var subreddits = ['evilbuildings', 'earthporn', 'ArchitecturePorn', 'CozyPlaces', 'architecture', 'museumporn']

module.exports = {
    name: 'inspiration',
    description: 'Level design inspiration',
    execute(message, args) {
        var page = getRandomInt(1, 50)
        var subreddit = subreddits[getRandomInt(0, subreddits.length)]
        
        var options = {
            host: 'api.imgur.com',
            path: '/3/gallery/r/' + subreddit + '/time/' + page,
            headers: {
                'Authorization': 'Client-ID ' + process.env.IMGUR
            }
        }

        https.get(options, function(resp) {
            data = '';
            resp.on('data', function(chunk) {
                data += chunk;
            })
            resp.on('end', function() {
                var info = JSON.parse(data)
                var attempts = 0
                try {
                    while (attempts < 10) {
                        attempts += 1
                        var num = getRandomInt(0, info.data.length)
                        var d = info.data[num]
                        if (d.animated) continue;
                        var embed = new discord.RichEmbed()
                        .setTitle(d.title)
                        .setImage(d.link)
                        message.channel.send(embed)
                        break
                    }
                } catch(e) {
                    message.channel.send('Woops, I dropped the inspiration. Try again.')
                }
            })
        }).on('error', function(err) { console.log(err); message.channel.send(err.message) })
    },
};
const https = require('https');
const discord = require('discord.js');

require('dotenv').config()

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// These subreddits are all meme related
var subreddits = ['adviceanimals', 'funny', 'memes', 'surrealmemes']

module.exports = {
    name: 'meme',
    description: 'Grab a COOL MEME from reddit',
    execute(message, args) {
        var page = getRandomInt(1, 50)
        var subreddit = subreddits[getRandomInt(0, subreddits.length)]
        
        // Prepare a request to the imgur API
        // This requires the key to be defined in the .env file
        var options = {
            host: 'api.imgur.com',
            path: '/3/gallery/r/' + subreddit + '/time/' + page,
            headers: {
                'Authorization': 'Client-ID ' + process.env.IMGUR
            }
        }
        
        // Perform the request
        https.get(options, function(resp) {
            data = '';
            resp.on('data', function(chunk) {
                data += chunk;
            })
            resp.on('end', function() {
                var info = JSON.parse(data)
                var attempts = 0
                
                // Some hacky stuff to get a random image from the page?
                // Todo: fix this so it doesn't overshoot pages (only an issue on smaller subreddits)
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
                    message.channel.send('Woops, I dropped the meme. Try again.')
                }
            })
        }).on('error', function(err) { console.log(err); message.channel.send(err.message) })
    },
};
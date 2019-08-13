const discord = require('discord.js');

module.exports = {
    name: 'wackymeme',
    description: 'Get a random poorly-made meme',
    execute(message, args) {
        // Specifically this fetchs a random image tagged meme off flickr
        // It's extremely unpredictable at best, hence the wacky nature!
        var rand = new Date().getMilliseconds();
        var image = new discord.RichEmbed().setImage('https://loremflickr.com/512/512/meme?random=' + rand)
        message.channel.send(image)
    },
};
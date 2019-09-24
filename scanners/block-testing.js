const discord = require('discord.js')

module.exports = {
    description: 'Stops the production version of the bot responding to messages in the testing channel',
    execute(message, client) {
        if(message.channel.id == '583635933585342466') {
            return client.uptime < (5 * 60 * 1000)
        } else {
            return true
        }
    },
}
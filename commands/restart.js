module.exports = {
    name: 'restart',
    description: '🛡️ Restarts Bottimus',
    execute(message, args, client) {
        var user = message.member
        if(client.isAdministrator(user)) {
            // Restart the bot after a short delay
            // Only let admins do this for obvious reasons
            message.channel.send('Goodbye!')
            setTimeout(function() { process.exit(1) }, 1000)
        } else {
            message.channel.send('You need to be an Administrator to use this.')
        }
    },
}
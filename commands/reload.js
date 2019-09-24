module.exports = {
    name: 'reload',
    description: '🛡️ Reload commands and scanners',
    execute(message, args, client) {
        var user = message.member
        if(client.isAdministrator(user)) {
            // Restart the bot after a short delay
            // Only let admins do this for obvious reasons
            message.channel.send('Reloading commands...')
            client.loadCommands()
            client.loadScanners()
            message.channel.send('Complete!')
        } else {
            message.channel.send('You need to be an Administrator to use this.')
        }
    },
}
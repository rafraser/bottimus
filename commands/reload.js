const handlerSetup = require('../util/handler_setup')

module.exports = {
    name: 'reload',
    description: '🛡️ Reloads utility data',
    aliases: ['refresh', 'reloaddata'],
    guilds: ['309951255575265280'],
    execute(message, args, client) {
        if (!client.isAdministrator(message.member)) {
            message.channel.send('You need to be an Administrator to use this!')
            return
        }

        // Run the handler setup again
        handlerSetup.setup(client)
        message.channel.send('Reloading!')
    }
}

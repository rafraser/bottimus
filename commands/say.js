module.exports = {
    name: 'say',
    description: '🛡️ Secret admin command',
    execute(message, args, client) {
        var user = message.member
        if(client.isAdministrator(user)) {
            // Sneakily send a message and delete the command usage
			var string = args.join(' ')
			message.delete()
            message.channel.send(string)
        }
    },
}
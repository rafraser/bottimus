module.exports = {
    name: 'edit',
    description: '🛡️ Edit a previously sent bot message',
    hidden: true,
    execute(message, args, client) {
        var user = message.member
        if(client.isAdministrator(user)) {
            var id = args.shift()
            
			var string = args.join(' ')
			message.delete()
            message.channel.fetchMessage(id)
            .then(message => message.edit(string))
        }
    },
}
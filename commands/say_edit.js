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
            
            // Replace the message content with the arguments given
            message.channel.fetchMessage(id).then(function(message) {
                message.edit(string)
            })
        }
    },
}
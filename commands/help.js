module.exports = {
    name: 'help',
    description: 'List all the commands the bot can use',
    execute(message, args, client) {
        var codestring = 'List of commands:\n```python\n'
        for(cmd of client.commands) {
            codestring += cmd[0].padEnd(10, ' ') + ' ' + cmd[1].description + '\n'
        }
        codestring += '```'
        message.channel.send(codestring)
    },
}
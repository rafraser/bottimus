const discord = require('discord.js')
const fs = require('fs')

module.exports = {
    name: 'serverlist',
    description: 'List all servers that the bot is in',
    guilds: ['309951255575265280'],
    cooldown: 30,
    execute(message, args, client) {
        // Restrict to administrators
        if (!client.isAdministrator(message.member)) {
            return
        }

        // Build a table of server names and owners
        let serverList = '```\n'
        client.guilds.forEach(guild => {
            serverList += guild.name.padEnd(40, ' ') + guild.owner.displayName + '\n'
        })

        // Send the message
        serverList += '```'
        message.channel.send(serverList)
    }
}
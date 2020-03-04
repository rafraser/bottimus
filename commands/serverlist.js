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
            const name = client.padOrTrim(guild.name, 30)
            const owner = client.padOrTrim(guild.owner.displayName, 20)
            serverList += `${name}  ${owner}\n`
        })

        // Send the message
        serverList += '```'
        message.channel.send(serverList)
    }
}
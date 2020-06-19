const pool = require('../util/database')
const discord = require('discord.js')

// Helper function to get statistics
function queryHelper(queryString, args) {
    return new Promise((resolve, reject) => {
        pool.query(queryString, args, (err, results) => {
            if (err) {
                reject(err)
            } else {
                resolve(results)
            }
        })
    })
}

function buildFriendsTable(client, message, gid) {
    const queryString = 'SELECT discordid, code FROM arcade_switchcode WHERE guild = ?'
    queryHelper(queryString, [gid]).then(results => {
        let codestring = '__Switch Codes__\nTo add your code to this list, type `!switchcode SW-1111-2222-3333`\n\n```yaml\n'
        if (results.length < 1) {
            codeString += 'Nobody has listed their friend code yet - be the first!'
        }
        for (const result of results) {
            const u = client.users.cache.get(result.discordid)
            let display = result.discordid
            if (u) { display = u.username }

            const name = client.padOrTrim(display, 25)
            codestring += `${name} ${result.code}\n`
        }

        codestring += '```'
        message.channel.send(codestring)
    })
}

module.exports = {
    name: 'switchcodes',
    description: 'Get a list of Switch Friend Codes for users in this server',
    cooldown: 5,
    aliases: ['switch', 'switchcode'],
    execute(message, args, client) {
        // If ran with no arguments, list all user codes
        if (args.length < 1) {
            buildFriendsTable(client, message, message.channel.guild.id)
            return
        }

        let code = args[0].match(/SW-\d{4}-\d{4}-\d{4}/)
        if (code) {
            // Update code in the listing
            const updateString = 'INSERT INTO arcade_switchcode VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE code = VALUES(code);'
            queryHelper(updateString, [message.member.id, message.channel.guild.id, code]).then(_ => {
                message.channel.send('Friend code updated successfully ✅')
            }).catch(_ => {
                message.channel.send('Something went wrong')
            })
        } else if (args[0] === 'remove') {
            // Remove code from listing
            const updateString = 'DELETE FROM arcade_switchcode WHERE discordid = ? AND guild = ?;'
            queryHelper(updateString, [message.member.id, message.channel.guild.id]).then(_ => {
                message.channel.send('Friend code removed from listing ✅')
            }).catch(_ => {
                message.channel.send('Something went wrong')
            })
        } else {
            // List all user codes
            buildFriendsTable(client, message, message.channel.guild.id)
        }
    }
}
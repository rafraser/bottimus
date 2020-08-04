import { Client, Message } from "../command"
import { User } from "discord.js"
import { queryHelper } from "../database"

function updateUserData(user: User) {
    const queryString = 'INSERT INTO bottimus_userdata VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE username = VALUES(username), tag = VALUES(tag), avatar = VALUES(avatar)';
    return queryHelper(queryString, [user.id, user.username, user.tag, user.displayAvatarURL()])
}

export default {
    name: 'updateallusers',
    description: '🛡️ Update all user data',
    guilds: ['309951255575265280'],

    async execute(client: Client, message: Message, args: string[]) {
        if (!client.isAdministrator(message.member)) {
            message.channel.send('You need to be an Administrator to use this!')
            return
        }

        let forceMode = false

        // If arguments are specified, then search for those
        if (args.length >= 1) {
            for (let arg of args) {
                if (arg == 'force') {
                    forceMode = true
                    break
                }

                let user = await client.users.fetch(arg, false)
                updateUserData(user)
            }

            if (!forceMode) return
        }

        // Fetch all the user IDs
        // Depending on if force mode is active, select a different set of IDs
        const partialQuery = 'SELECT userid FROM arcade_currency WHERE userid NOT IN (SELECT discordid FROM bottimus_userdata);'
        const forceQuery = 'SELECT userid FROM arcade_currency'
        const queryString = forceMode ? forceQuery : partialQuery
        const results = await queryHelper(queryString, [])
        for (let result of results) {
            const user = await client.users.fetch(result.userid, false)
            updateUserData(user)
        }
        message.channel.send(`Updated ${results.length} users.`)
    }
}
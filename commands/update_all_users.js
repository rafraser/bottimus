const pool = require('../util/database')

function updateUserData(user) {
    const queryString = 'INSERT INTO bottimus_userdata VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE username = VALUES(username), tag = VALUES(tag), avatar = VALUES(avatar)';
    pool.query(queryString, [user.id, user.username, user.tag, user.displayAvatarURL])
}

module.exports = {
    name: 'updateallusers',
    description: '🛡️ Update all user data',
    guilds: ['309951255575265280'],
    execute(message, args, client) {
        if (!client.isAdministrator(message.member)) {
            message.channel.send('You need to be an Administrator to use this!')
            return
        }

        let forceMode = false

        // If arguments are specified, then search for those
        if (args.length >= 1) {
            for (let arg of args) {
                if(arg == 'force') {
                    forceMode = true
                    break
                }

                client.fetchUser(arg, false).then(user => {
                    updateUserData(user)
                }).catch()
            }
            
            if(!forceMode) return
        }

        // Fetch all the user IDs
        // Depending on if force mode is active, select a different set of IDs
        const partialQuery = 'SELECT userid FROM arcade_currency WHERE userid NOT IN (SELECT discordid FROM bottimus_userdata);'
        const forceQuery = 'SELECT userid FROM arcade_currency'
        const queryString = forceMode ? forceQuery : partialQuery
        pool.query(queryString, function (err, results) {
            if (err) {
                message.channel.send(err.toString())
                return
            }

            for (let result of results) {
                client.fetchUser(result.userid, false).then(user => {
                    updateUserData(user)
                }).catch(err => {
                    console.log('Failed to get ', result.userid)
                })
            }
            message.channel.send(`Updated ${results.length} users.`)
        })
    }
}
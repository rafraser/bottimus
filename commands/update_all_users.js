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

        // If arguments are specified, then search for those
        if (args.length >= 1) {
            for (let arg of args) {
                client.fetchUser(arg, false).then(user => {
                    updateUserData(user)
                }).catch()
            }
            return
        }

        // Fetch all the user IDs
        // Anyone we care about has currency
        const queryString = 'SELECT userid FROM arcade_currency'
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
        })
    }
}
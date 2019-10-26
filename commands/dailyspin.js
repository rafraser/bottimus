const arcade = require('../arcade')
const pool = require('../database')
const discord = require('discord.js')

function getLastSpin(id) {
    return new Promise(function(resolve, reject) {
        var query_string = "SELECT lastspin FROM arcade_dailyspin WHERE discordid = ?"
        pool.query(query_string, [id], function(err, results) {
            if(err) {
                reject(err)
            } else {
                resolve(results)
            }
        })
    })
}

function updateLastSpin(id, date) {
    var query_string = "INSERT INTO arcade_dailyspin VALUES(?, ?, 1) ON DUPLICATE KEY UPDATE lastspin = VALUES(lastspin), number = number + VALUES(number)"
    pool.query(query_string, [id, date])
}

function formatTime(ms) {
    if(ms < 120 * 1000) {
        return Math.floor(ms/1000) + ' seconds'
    } else if(ms < 3600 * 1000) {
        return Math.floor(ms/60000) + ' minutes'
    } else {
        return Math.floor(ms/3600000) + ' hours'
    }
}

function pickWheel() {
    var wheels = [
        ['#coin 100', '#coin 200', '#coin 400', '#coin 200', '#coin 400', '#coin 100'],
        ['#coin 100', '#coin 100', '#coin 100', '#coin 100', '#coin 100', '#coin 100', '#coin 100', '#coin 100', '#coin 1000'],
        ['ZERO', '#coin 200', '#coin 400'],
        ['ZERO', '#coin 400', 'ZERO', '#coin 400', 'ZERO', '#coin 400', 'ZERO', '#coin 400']
    ]

    return wheels[Math.floor(Math.random() * wheels.length)]
}

module.exports = {
    name: 'dailyspin',
    description: 'Spin a prize wheel once a day!',
    execute(message, args, client) {
        getLastSpin(message.member.id).then(function(results) {
            var lastspin = results[0]
            // If the user has previously spun the wheel, check that it's been 24 hours
            if(lastspin) {
                lastspin = results[0].lastspin
                var current = new Date()
                var elapsed = Math.abs(current - lastspin)
                var delay = 12 * 3600 * 1000
                if(elapsed < delay) {
                    message.channel.send('Your next daily spin is in ' + formatTime(delay - elapsed))
                    return
                }
            }

            message.channel.send('Get ready!')

            // Spin the wheel!
            var prizes = pickWheel()
            updateLastSpin(message.member.id, new Date())

            client.executePython('spinner', prizes).then(function(data) {
                var attachment = new discord.Attachment('./img/spinner.gif')
                message.channel.send(attachment).then(function() {
                    setTimeout(function() {
                        // After a short delay, announce the winning and award credits
                        if(data.startsWith('ZERO')) {
                            message.channel.send('Oh no :( Better luck next time!')
                        } else {
                            var amount = parseInt(data.replace('#coin ', ''), 10)
                            var coin = client.emojis.get('631834832300670976')
                            message.channel.send(`Congrats! You won ${coin} ${amount}`)
                            arcade.incrementArcadeCredits(message.member.id, amount)
                        }
                    }, 6500)
                }).catch(function() {
                    message.channel.send('The wheel broke :(')
                })
            })
        }).catch(function(err) {
            message.channel.send(err.toString())
        })
    },
}
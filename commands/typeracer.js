const words = require('../typeracer_words')
const arcade = require('../arcade')
const pool = require('../database')
const discord = require('discord.js')

// Stores results for players that complete the Type Race
function incrementStatScore(userid, speed) {
    var query_one = 'INSERT INTO arcade_typeracer (discordid, completed, speed_average) VALUES(?, 1, ?) ON DUPLICATE KEY UPDATE speed_average = ((speed_average * completed) + VALUES(speed_average))/(completed + 1), completed = completed + 1;'
    var query_two = 'SELECT speed_best FROM arcade_typeracer WHERE discordid = ?;'
    var query_three = 'UPDATE arcade_typeracer SET speed_best = ?, date_best = ? WHERE discordid = ?;'
    
    // callback hell I know
    var p = new Promise(function(resolve, reject) {
        pool.query(query_one, [userid, speed], function(err, results) {
            if (err) { console.log(err); return }
            pool.query(query_two, [userid], function(err, results) {
                if (err) { console.log(err); return }
                var best = results[0].speed_best
                
                if(speed > best) {
                    pool.query(query_three, [speed, new Date(), userid], function(err) {
                        if (err) console.log(err)
                    })
                    resolve(true)
                } else {
                    resolve(false)
                }
            })
        })
    })
    return p
}

// UNUSED Function
// Stores results for players that complete the Type Race on mobile
function incrementStatScoreMobile(userid, speed) {
    var query_one = 'INSERT INTO arcade_typeracer_mobile (discordid, completed, speed_average) VALUES(?, 1, ?) ON DUPLICATE KEY UPDATE completed = completed + 1, speed_average = ((speed_average * completed) + VALUES(speed_average))/(completed + 1);'
    var query_two = 'SELECT speed_best FROM arcade_typeracer_mobile WHERE discordid = ?;'
    var query_three = 'UPDATE arcade_typeracer_mobile SET speed_best = ?, date_best = ? WHERE discordid = ?;'
    
    // callback hell I know
    var p = new Promise(function(resolve, reject) {
        pool.query(query_one, [userid, speed], function(err, results) {
            if (err) { console.log(err); return }
            pool.query(query_two, [userid], function(err, results) {
                if (err) { console.log(err); return }
                var best = results[0].speed_best
                
                if(speed > best) {
                    pool.query(query_three, [speed, new Date(), userid], function(err) {
                        if (err) console.log(err)
                    })
                    resolve(true)
                } else {
                    resolve(false)
                }
            })
        })
    })
    return p
}

function shuffle(a) {
    var j, x, i
    for(i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i+1))
        x = a[i]
        a[i] = a[j]
        a[j] = x
    }
    
    return a
}

function messageFilter(m) {
    // Return all messages
    // These get proccessed when collected
    return (!m.member.user.bot)
}

function startTypeRacer(client, message, display) {
    var n = 30
    var hard = 5
    var list = shuffle(words.easy).slice(0, n-hard).concat(shuffle(words.hard).slice(0, hard))
    display.delete()
    
    client.executePython('typeracer', list.join(' ')).then(function() {
        // Send the image to the channel
        var attachment = new discord.Attachment('./img/typeracer.png')
        message.channel.send(attachment).then(function() {
            var starttime = new Date()
            var winners = new Map()
            
            var collector = message.channel.createMessageCollector(messageFilter, {time: 60000 })
            collector.on('collect', function(m) {
                // Check the message and see if it's a valid race response
                // Skip message if already won
                if(winners.get(m.member.id)) return
                
                var endtime = new Date()
                var attempt = m.content.split(' ')
                if(attempt.length < n) return
                
                // Check each word submitted by the user
                // They are allowed 2 mistakes out of 50 words (96% accuracy)
                var wrong = 0
                for(var i=0; i<n; i++) {
                    if(attempt[i].toLowerCase() == list[i].toLowerCase()) continue
                    
                    // Wrong word, oh no!
                    wrong++
                    if(wrong > 1) return
                }
                
                // Everything is fine!
                winners.set(m.member.id, endtime)
                
                // React to the message
                m.delete()
                m.channel.send('✅ ' + m.member.displayName + ' has completed the race!')
            })
            
            collector.on('end', function() {
                var letters = list.join(' ').length
                var place = 1
                var string = 'The race is over!\n'
                // Announce the winners
                for(var result of winners) {
                    var member = message.guild.members.get(result[0])
                    var finishtime = result[1]
                    var duration = (finishtime - starttime) / 1000
                    var wpm = Math.floor((letters/5) * (60/duration))
                    
                    // Award credits based on WPM
                    var credits = wpm/10 <= 1 ? 1 : wpm/10 >= 10 ? 10 : wpm/10
                    arcade.incrementArcadeCredits(result[0], credits)
                    
                    // Store data, announcing records when applicable
                    incrementStatScore(result[0], wpm).then(function(record) {
                        if(record) {
                            message.channel.send('⭐ ' + member.displayName + ' set a new record of ' +  wpm + 'WPM')
                        }
                    })
                    
                    string += '#' + place + ') ' + member.displayName + ': ' + wpm + 'WPM\n'
                    place++
                }
                
                message.channel.send(string)
                client.playingTyperacer = false
            })
        })
    }).catch(function(e) {message.channel.send(e)})
}

module.exports = {
    name: 'typeracer',
    description: 'Play a game of Type Racer',
    execute(message, args, client) {
        // Only allow a single game of hangman
        if(client.playingTyperacer) return
        
        // Generate a list of n words for type racer
        // Of these words, a certain number are taken from the hard list
        // while the rest are taken from the easy list
        client.playingTyperacer = true
        
        message.channel.send('Get ready for Type Racer!').then(function(m) {
            // Small delay before starting to allow players time to prepare
            setTimeout(function() { m.edit('Type Racer starting in: 5') }, 5000)
            setTimeout(function() { m.edit('Type Racer starting in: 4') }, 6000)
            setTimeout(function() { m.edit('Type Racer starting in: 3') }, 7000)
            setTimeout(function() { m.edit('Type Racer starting in: 2') }, 8000)
            setTimeout(function() { m.edit('Type Racer starting in: 1') }, 9000)
            setTimeout(function() { startTypeRacer(client, message, m) }, 10000)
        })
    },
}
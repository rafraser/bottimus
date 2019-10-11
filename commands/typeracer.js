const words = require('../words')
const words = require('../typeracer_words')
const arcade = require('../arcade')

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

module.exports = {
    name: 'typeracer',
    description: 'Play a game of Type Racer',
    execute(message, args, client) {
        var n = 25
        var list = shuffle(words).slice(0, n)
        var starttime = new Date()
        message.channel.send(list.join(' ')).then(function() {
            var starttime = new Date()
            var winners = new Map()
            
            var collector = message.channel.createMessageCollector(messageFilter, {time: 40000 })
            collector.on('collect', function(m) {
                // Check the message and see if it's a valid race response
                // Skip message if already won
                if(winners.get(m.member.id)) return
                
                var endtime = new Date()
                var attempt = m.content.split(' ')
                console.log(attempt.length, n)
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
                console.log('Passed!')
                
                // Everything is fine!
                winners.set(m.member.id, endtime)
                
                // React to the message
                m.react('✅')
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
                    
                    string += '#' + place + ') ' + member.displayName + ': ' + wpm + 'WPM\n'
                    place++
                }
                
                message.channel.send(string)
            })
        })
    },
}
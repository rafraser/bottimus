const pool = require('../database')
const discord = require('discord.js')

function calculateTotals(results) {
    var total_guesses = 0
    var total_correct = 0
    
    for(result of results) {
        total_guesses = total_guesses + result['attempted']
        total_correct = total_correct + result['correct']
    }
    
    return [total_guesses, total_correct]
}

module.exports = {
    name: 'triviastats',
    description: 'Fetchs statistics from Trivia',
    execute(message, args, client) {
        var query_string = "SELECT category, attempted, correct, (correct/attempted) AS percent FROM trivia_stats WHERE discordid = ? ORDER BY (correct/attempted) DESC;"
        
        // Query database
        pool.query(query_string, [message.member.id], function(err, results) {
            if (err) {
                console.log(err)
                message.channel.send('Couldn\'t get stats :(')
                message.channel.send(err.toString())
            } else {
                // results! yay!
                try {
                    var username = message.member.displayName
                    var [total_guesses, total_correct] = calculateTotals(results)
                    
                    // Generate a fancy embed
                    var embed = new discord.RichEmbed()
                        .setColor('#4cd137')
                        .setTitle(`Trivia Stats for ${username}`)
                        .addField('Questions Answered', `${total_guesses}`, true)
                        .addField('Questions Correct', `${total_correct}`, true)
                        .addField('Percentage', `${Math.floor((total_correct/total_guesses)*100) || 0}%`, true)
                    message.channel.send(embed).then(function() {
                        // Generate a not so fancy looking breakdown of the trivia categories
                        // Wait until the first embed is sent
                        var codestring = '```python\n\n'
                        for(result of results) {
                            codestring += result['category'].padEnd(40, ' ') + (result['correct'] + '/' + result['attempted']).padStart(8, ' ') + ' (' + Math.floor(result['percent']*100) + '%)' + '\n'
                        }
                        codestring += '```'
                        message.channel.send(codestring)
                    })
                } catch (e) { 
                    message.channel.send('User not found in database')
                }
            }
        })
    },
}
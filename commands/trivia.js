const discord = require('discord.js')
const https = require('https')
const arrayOfLetters = ['A', 'B', 'C', 'D']
const emojiToNum = {'🇦': 0, '🇧': 1, '🇨': 2, '🇩': 3}
const pool = require('../database')
const htmlReplacements = {'&quot;': '"', '&amp;': '&', '&#039;': "'", '&rsquo;': "'", '&eacute;': '�', '&pound;': '�', '&deg;': '�'}

function removeHTMLCharacters(str) {
    for(var rep in htmlReplacements) {
        str = str.replace(new RegExp(rep, 'g'), htmlReplacements[rep]) 
    }
    return str
}

function incrementStatScore(userid, category, correct) {
    var query_string;
    if(correct) {
        query_string = "INSERT INTO trivia_stats VALUES(?, ?, 1, 1) ON DUPLICATE KEY UPDATE attempted = attempted + 1, correct = correct + 1"
    } else {
        query_string = "INSERT INTO trivia_stats VALUES(?, ?, 1, 0) ON DUPLICATE KEY UPDATE attempted = attempted + 1, correct = correct"
    }
    
    pool.query(query_string, [userid, category],function(err, results) {
        if (err) {
            console.log(err)
        }
    })
}

module.exports = {
    name: 'trivia',
    description: 'Play a trivia question',
    execute(message, args, client) {
        https.get('https://opentdb.com/api.php?amount=1&type=multiple', function(resp) {
            data = ''
            resp.on('data', function(chunk) {
                data += chunk
            })
            resp.on('end', function() {
				var info
				try {
					info = JSON.parse(data).results[0]
				} catch(error) {
					message.channel.send('Error in question data')
					return
				}
                var answers = info.incorrect_answers
                var correct = Math.floor(Math.random() * Math.floor(4))
                answers.splice(correct, 0, info.correct_answer)
                
                // Format the question
                var question = removeHTMLCharacters(info.question)
				// Format the answers
				for(var i=0; i<4; i++) {
					answers[i] = removeHTMLCharacters(answers[i])
				}
                
                var difficulty = info.difficulty.charAt(0).toUpperCase() + info.difficulty.slice(1)
				
                // Build the embed
                var embed = new discord.RichEmbed()
                .setColor('#4cd137')
                .setTitle(info.category)
                .setDescription(question)
                .setFooter('Difficulty: ' + difficulty)
                .addField('A', answers[0])
                .addField('B', answers[1])
                .addField('C', answers[2])
                .addField('D', answers[3])
                message.channel.send(embed).then(function(msg) {
                    // React the guesses
                    msg.react('🇦').then(function() { msg.react('🇧').then(function() { msg.react('🇨').then(function() { msg.react('🇩') })})})
                    
                    // Wait 15 seconds for reactions
                    var filter = function(reaction) {
                        var n = reaction.emoji.name 
                        return (n == '🇦' || n == '🇧' || n == '🇨' || n == '🇩')
                    }
                    
                    msg.awaitReactions(filter, {time: 15000}).then(function(collected) {
                        message.channel.send('The correct answer: ' + arrayOfLetters[correct])
                        
                        // Collect all the guesses from all the players
                        // Disqualify any players that guessed multiple times
                        var guesses = {}
                        var usernames = {}
                        collected.forEach(function(reaction) {
                            reaction.users.forEach(function(user) {
                                if(user.bot) return;
                                
                                if (guesses[user.id]) {
                                    guesses[user.id] = 'DQ'
                                } else {
                                    guesses[user.id] = emojiToNum[reaction._emoji.name]
                                }
                                usernames[user.id] = user.username
                            })
                        })
                        
                        // From all the guesses, determine who won
                        var winners = []
                        for (var player in guesses) {
                            if (guesses[player] == correct) {
                                winners.push(usernames[player])
                                incrementStatScore(player, info.category, true)
                            } else {
                                incrementStatScore(player, info.category, false)
                            }
                        }
						
                        // Message if there is any winners
                        if (winners.length > 0) {
                            message.channel.send('Congratulations to: ' + winners.join(', '))
                        }
                    })
                    
                })
            })
        })
    },
}
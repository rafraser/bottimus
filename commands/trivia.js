const discord = require('discord.js')
const https = require('https')
const arrayOfLetters = ['A', 'B', 'C', 'D']
const emojiToNum = {'🇦': 0, '🇧': 1, '🇨': 2, '🇩': 3}

function removeHTMLCharacters(str) {
    str = str.replace(new RegExp('&quot;', 'g'), '"')
    str = str.replace(new RegExp('&amp;', 'g'), '&')
    str = str.replace(new RegExp('&#039;', 'g'), "'")
    str = str.replace(new RegExp('&rsquo;', 'g'), "'")
	return str
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
				
                // Build the embed
                var embed = new discord.RichEmbed()
                .setColor(5034295)
                .setTitle(info.category)
                .setDescription(question)
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
                        collected.forEach(function(reaction) {
                            reaction.users.forEach(function(user) {
                                if (guesses[user.username]) {
                                    guesses[user.username] = 'DQ'
                                } else {
                                    guesses[user.username] = emojiToNum[reaction._emoji.name]
                                }  
                            })
                        })
                        
                        // From all the guesses, determine who won
                        var winners = []
                        for (var player in guesses) {
                            if (guesses[player] == correct) {
                                winners.push(player)
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
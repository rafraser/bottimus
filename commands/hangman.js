const discord = require('discord.js')
const https = require('https')
const pool = require('../database')
const words = require('../words')

function getRandomWord() {
    return words[Math.floor(Math.random() * words.length)]
}

function generateEmbed(attempts, guesses, fails) {
    //var diagram = hangmans[fails]
    var embed = new discord.RichEmbed()
    .setTitle('Hangman')
    .setDescription((8-fails) + " mistakes left!")
    .setFooter(attempts.join(' '))
    .addField(guesses.join(' '), "\u200b")
    return embed
}

function hangmanFilter(msg) {
    if (msg.content.length > 1) { return false }
    return ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(msg.content) > -1)
}

module.exports = {
    name: 'hangman',
    description: 'Play a game of Hangman',
    execute(message, args, client) {
        // Only allow one game of Hangman at once
        if(client.playingHangman) {
            return
        }
        
        var word = getRandomWord()
        var fails = 0
        var correct = 0
        var attempts = []
        var guesses = Array(word.length).fill('\\_')
        client.playingHangman = true
        
        message.channel.send(generateEmbed(attempts, guesses, fails)).then(function(game_msg) {
            var collector = game_msg.channel.createMessageCollector(hangmanFilter, {time: 60000})
            collector.on('collect', function(m) {
                var letter = m.content
                m.delete()
                
                // Don't count guesses twice
                if(attempts.includes(letter)) {
                    return
                }
                
                attempts.push(letter)
                if(word.indexOf(letter) == -1) {
                    // Incorrect guess, oh no :(
                    game_msg.channel.send('Uh oh! ' + letter + ' is not in the word!').then(function(msg) { msg.delete(1000) })
                    fails++
                } else {
                    // Correct guess!
                    game_msg.channel.send('Good guess! ' + letter + ' is in the word!').then(function(msg) { msg.delete(1000) })
                    
                    for(var i=0; i<word.length; i++) {
                        if(word.charAt(i) == letter) {
                            guesses[i] = letter
                            correct++
                        }
                    }
                }
                
                // Update the embed
                game_msg.edit(generateEmbed(attempts, guesses, fails))
                
                // End the game if the word is complete
                if(correct == word.length) {
                    collector.stop('win')
                }
                
                // End the game if there have been 8 failures
                if(fails == 8) {
                    collector.stop('lose')
                }
            })
            
            // Message for ending the game
            collector.on('end', function(collected, reason) {
                client.playingHangman = false
                
                if(reason == 'win') {
                    game_msg.channel.send('You win! The word was ' + word)
                } else if(reason == 'lose') {
                    game_msg.channel.send('Oh no! :(')
                    game_msg.channel.send('The word was ' + word)
                } else {
                    game_msg.channel.send('Time\s up! The word was ' + word)
                }
            })
        });
    }
}
const arcade = require('../arcade')
const pool = require('../database')
const discord = require('discord.js')

function updateScratch(id, amount) {
    var query_string = "INSERT INTO arcade_scratchcard VALUES(?, 1, ?) ON DUPLICATE KEY UPDATE winnings = winnings + VALUES(winnings), number = number + VALUES(number)"
    pool.query(query_string, [id, amount])
}

const prizes = [
    ['💰', 2500, 0.01],
    ['🍉', 1000, 0.04],
    ['🍒', 800, 0.06],
    ['🍋', 500, 0.11],
    ['🍓', 300, 0.15],
    ['🍇', 100, 0.27]
]

const icons = ['💰', '💰', '🍉', '🍉', '🍒', '🍒', '🍋', '🍋', '🍓', '🍓', '🍇', '🍇']

function weightedRandom() {
    var r = Math.random()
    for(var i=0; i<prizes.length; i++) {
        var p = prizes[i][2]
        if(r < p) return prizes[i]
        r -= p
    }
    return 0
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

function getPrizeList() {
    var winner = weightedRandom()
    if(winner == 0) {
        return [shuffle(icons).slice(0, 9), 0]
    } else {
        var ic = winner[0]
        var selection = shuffle(icons).slice(0, 6)
        var matches = 0
        var replacement = ['🍎', '🍍']
        while(selection.indexOf(ic) != -1) {
            selection[selection.indexOf(ic)] = replacement[matches]
            matches++
        }
        selection = selection.concat([ic, ic, ic])
        
        return [shuffle(selection), winner[1]]
    }
}

function generateScratchCard(msg, user, client) {
    var [prizes, amount] = getPrizeList()
    
    // Generate the grid of squares
    var message = ''
    for(var i=0; i<prizes.length; i++) {
        message += '||' + prizes[i] + '||'
        if((i+1)%3 == 0) {
            message += '\n'
        }
    }
    
    // Update the message with the scratchcard
    msg.clearReactions()
    var embed = new discord.RichEmbed()
    .setTitle('Scratch Card')
    .setColor('#ff9f43')
    .setDescription(message)
    msg.edit(embed)
    
    // Pay the winner
    arcade.incrementArcadeCredits(user, amount)
    updateScratch(user, amount)
    
    // Announce winnings after 5 seconds
    setTimeout(function() {
        if(amount > 0) {
            var coin = client.emojis.get('631834832300670976')
            msg.channel.send(`Congrats! You won ${coin} ${amount}`) 
        } else {
            msg.channel.send('Better luck next time :(')
        }
    }, 5000)
}

module.exports = {
    name: 'scratchcard',
    description: 'Scratch a prize card for 250 coins',
    aliases: ['scratch'],
    cooldown: 15,
    execute(message, args, client) {
        arcade.getArcadeCredits(message.member.id).then(function(amount) {
            if(amount <= 250) {
                message.channel.send('You need at least 250 coins for this!')
            } else {
                // Send a confirmation message
                message.channel.send('Scratch cards cost 250 coins: react to confirm').then(function(msg) {
                    msg.react('✅')
                    const filter = function(reaction, user) {
                        return user.id == message.member.id && reaction.emoji.name == '✅'
                    }
                    
                    var collector = msg.createReactionCollector(filter, {time: 5000})
                    collector.on('collect', function() {
                        // Confirmation received!
                        collector.stop()
                        arcade.incrementArcadeCredits(message.member.id, -250)
                        generateScratchCard(msg, message.member.id, client)
                    })
                })
            }
        })
    },
}
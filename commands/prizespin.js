const arcade = require('../arcade')
const pool = require('../database')
const discord = require('discord.js')

function getPrizeRarities() {
    var rarities = {}
    for(var rarity of arcade.rarities) {
        rarities[rarity] = []
    }
    
    for(var prize in arcade.prizes) {
        var p = arcade.prizes[prize]
        var r = arcade.rarities[p[1]]
        rarities[r].push(prize)
    }
    
    return rarities
}

function pickPrizes() {
    var prizelist = getPrizeRarities()
    var results = []
    for(var i=0; i<8; i++) {
        var p = Math.random()
        var rarity = 'Common'
        if(p > 0.9) {
            rarity = 'Legendary'
        } else if(p > 0.7) {
            rarity = 'Rare' 
        } else if(p > 0.4){
            rarity = 'Uncommon'  
        }
        
        var r = prizelist[rarity]
        var p = null
        //while(p == null || results.indexOf(p) != -1) {
            p = r[Math.floor(Math.random() * r.length)]
        //}
        results.push(p)
    }
    
    return results
}

function spinPrizeWheel(msg, user, client) {
    msg.clearReactions()
    msg.edit('Get ready!')
    var prizes = pickPrizes().map(x => '#prizes/' + x)
    
    client.executePython('spinner', prizes).then(function(data) {
        var attachment = new discord.Attachment('./img/spinner.gif')
        msg.channel.send(attachment).then(function() {
            var prize = data.replace('#prizes/', '').trim()
            arcade.unlockArcadePrize(user, prize)
            setTimeout(function() {
                generatePrizeGIF(prize, msg, client)
            }, 6500)
        }).catch(function(e) {
            msg.channel.send(e.toString())
            msg.channel.send('The wheel broke :(')
        })
    })
}

function generatePrizeGIF(prize, msg, client) {
    var p = arcade.prizes[prize]
    var args = ['prizes/'+prize, arcade.rarities[p[1]], arcade.rarities[p[1]] + " Prize!", arcade.prizes[prize][0]]
    client.executePython('sunburst', args).then(function() {
        var attachment = new discord.Attachment('./img/sunbeam.gif')
        msg.channel.send(attachment)
    })
}

module.exports = {
    name: 'prizespin',
    description: 'Try your luck at the legendary wheel of prizes!',
    cooldown: 60,
    execute(message, args, client) {
        arcade.getArcadeCredits(message.member.id).then(function(amount) {
            if(amount <= 1000) {
                message.channel.send('You need at least 1000 coins for this!')
            } else {
                // Send a confirmation message
                message.channel.send('The prize wheel costs 1000 coins: react to confirm').then(function(msg) {
                    msg.react('✅')
                    const filter = function(reaction, user) {
                        return user.id == message.member.id && reaction.emoji.name == '✅'
                    }
                    
                    var collector = msg.createReactionCollector(filter, {time: 5000})
                    collector.on('collect', function() {
                        // Confirmation received!
                        collector.stop()
                        arcade.incrementArcadeCredits(message.member.id, -1000)
                        spinPrizeWheel(msg, message.member.id, client)
                    })
                })
            }
        })
    },
}
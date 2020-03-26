const discord = require('discord.js')

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max)) + 1;
}

function testDiceRolling(max) {
    let results = {}
    for (let i = 0; i < 10000; i++) {
        const result = getRandomInt(max)
        results[result] = (result in results ? results[result] : 0) + 1
    }
    console.log(results)
}

module.exports = {
    name: 'dice',
    description: 'Roll a simple dice',
    aliases: ['roll'],
    execute(message, args) {
        let rolls = args.map(arg => {
            // Check if this is a multi-roll
            let multiRoll = arg.match(/(?<number>\d+)d(?<max>\d+)/)
            if (multiRoll) {
                let number = parseInt(multiRoll.groups.number)
                let max = parseInt(multiRoll.groups.max)

                let total = 0
                for (let i = 0; i < number; i++) {
                    total += getRandomInt(max)
                }

                return total
            } else {
                // Check if this is a dN dice
                let singleRoll = arg.match(/d(?<max>\d+)/)
                if (singleRoll) {
                    let max = parseInt(singleRoll.groups.max)
                    return getRandomInt(max)
                } else {
                    // Check if this is a number
                    try {
                        let max = parseInt(arg)
                        return getRandomInt(max)
                    } catch (e) {
                        return null
                    }
                }
            }
        })

        // Send the result, excluding any invalid dice
        rolls = rolls.filter(x => !!x)
        if (rolls.length < 1) {
            message.channel.send('Enter valid dice!')
        } else {
            message.channel.send(`🎲 ${rolls.join(" ")}`)
        }
    }
}

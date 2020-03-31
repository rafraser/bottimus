const discord = require('discord.js')

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max)) + 1;
}

function diceRoll(number, max) {
    if (number === 1) {
        return getRandomInt(max)
    } else {
        let total = 0
        for (let i = 0; i < number; i++) {
            total += getRandomInt(max)
        }
        return total
    }
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
    description: 'Roll some dice using DnD syntax. Multiple rolls can be done at once.\nExamples: `!dice 20` `!dice d20 4d10`\nAlso supports advantage modifiers: `!dice adv-d20` `!dice dis-3d10`',
    aliases: ['roll'],
    execute(message, args) {
        let rolls = args.map(arg => {
            let rollData = arg.match(/((?<modifier>adv|dis)-)?(?<number>\d+)?d(?<max>\d+)/)
            if (rollData) {
                let number = parseInt(rollData.groups.number) || 1
                let max = parseInt(rollData.groups.max)
                let modifier = rollData.groups.modifier || null
                if (modifier == 'adv') {
                    let roll1 = diceRoll(number, max)
                    let roll2 = diceRoll(number, max)
                    return Math.max(diceRoll(number, max), diceRoll(number, max))
                } else if (modifier == 'dis') {
                    return Math.min(diceRoll(number, max), diceRoll(number, max))
                } else {
                    return diceRoll(number, max)
                }
            } else {
                try {
                    let max = parseInt(arg)
                    return getRandomInt(max)
                } catch (e) {
                    return null
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

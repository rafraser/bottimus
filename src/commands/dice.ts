import { Client, Message } from '../command'

function getRandomInt (max: number): number {
  return Math.floor(Math.random() * Math.floor(max)) + 1
}

function diceRoll (number: number, max: number): number {
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

export function testDiceRolling (max: number) {
  const results = {} as any
  for (let i = 0; i < 10000; i++) {
    const result = getRandomInt(max).toString()
    results[result] = (result in results ? results[result] : 0) + 1
  }
  console.log(results)
}

export default {
  name: 'dice',
  description: 'Roll some dice using DnD syntax. Multiple rolls can be done at once.\nExamples: `!dice 20` `!dice d20 4d10`\nAlso supports advantage modifiers: `!dice adv-d20` `!dice dis-3d10`',
  aliases: ['roll'],

  async execute (client: Client, message: Message, args: string[]) {
    let rolls = args.map(arg => {
      const rollData = arg.match(/((?<modifier>adv|dis)-)?(?<number>\d+)?d(?<max>\d+)/)
      if (rollData) {
        const number = parseInt(rollData.groups.number) || 1
        const max = parseInt(rollData.groups.max)
        const modifier = rollData.groups.modifier || null
        if (modifier === 'adv') {
          return Math.max(diceRoll(number, max), diceRoll(number, max))
        } else if (modifier === 'dis') {
          return Math.min(diceRoll(number, max), diceRoll(number, max))
        } else {
          return diceRoll(number, max)
        }
      } else {
        try {
          const max = parseInt(arg)
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
      message.channel.send(`${rolls.map(x => `**${x}**`).join('  |  ')}`)
    }
  }
}

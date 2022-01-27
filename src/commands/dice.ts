import { Client, Message } from '../command'

function getRandomInt (max: number): number {
  return Math.floor(Math.random() * Math.floor(max)) + 1
}

export function rollArray (length: number, max: number): number[] {
  return Array.from({ length }, () => getRandomInt(max))
}

export function sumArray (array: number[]): number {
  return array.reduce((a, b) => a + b, 0)
}

export function advantageRoll (array: number[]): [number[], number] {
  // Sort the dice in ascending order
  // Take the best half and sum them
  const n = Math.floor(array.length / 2)
  const sorted = array.sort((a, b) => (b - a))
  return [sorted, sumArray(sorted.slice(0, n))]
}

export function disadvantageRoll (array: number[]): [number[], number] {
  // Sort the dice in descending order
  // Take the best half and sum them
  const n = Math.floor(array.length / 2)
  const sorted = array.sort((a, b) => (a - b))
  return [sorted, sumArray(sorted.slice(0, n))]
}

export function parseAndRoll (dice: string): [number[], number] {
  // Use regex to match fancy dnd dice expressions
  const rollData = dice.match(/((?<modifier>adv|dis)-)?(?<number>\d+)?d(?<max>\d+)/)
  if (rollData) {
    const number = parseInt(rollData.groups.number) || 1
    const max = parseInt(rollData.groups.max)
    const modifier = rollData.groups.modifier || null

    if (modifier === 'adv') {
      return advantageRoll(rollArray(number * 2, max))
    } else if (modifier === 'dis') {
      return disadvantageRoll(rollArray(number * 2, max))
    } else {
      const rolledDice = rollArray(number, max)
      return [rolledDice, sumArray(rolledDice)]
    }
  } else {
    // Attempt to parse as a basic number
    try {
      const max = parseInt(dice)
      const roll = getRandomInt(max)
      return [[roll], roll]
    } catch (e) {
      return null
    }
  }
}

export default {
  name: 'dice',
  description: 'Roll some dice using DnD syntax. Multiple rolls can be done at once.\nExamples: `!dice 20` `!dice d20 4d10`\nAlso supports advantage modifiers: `!dice adv-d20` `!dice dis-3d10`',
  aliases: ['roll'],

  async execute (client: Client, message: Message, args: string[]) {
    const rolls = args.map(parseAndRoll).filter(x => !!x)
    if (rolls.length === 0) {
      // No valid dice
      await message.channel.send('Enter valid dice!')
    } else if (rolls.length === 1) {
      const [roll, total] = rolls[0]
      if (roll.length === 1) {
        // Only a single dice was rolled
        await message.channel.send(`**${roll[0]}**`)
      } else {
        // Report makeup + total
        await message.channel.send(`${roll.map(x => `${x}`).join(', ')} \n= **${total}**`)
      }
    } else {
      // Report totals only
      const totals = rolls.map(x => x[1])
      await message.channel.send(`${totals.map(x => `**${x}**`).join('  |  ')}`)
    }
  }
}

import { Client, Message } from '../command'
import { queryHelper } from '../database'
import { getArcadeCredits, incrementArcadeCredits } from '../arcade'
import { User, MessageReaction, MessageAttachment } from 'discord.js'

function updateRouletteStat (userid: string, winnings: number, bet: number) {
  const queryString = 'INSERT INTO arcade_roulette VALUES(?, 1, ?, ?) ON DUPLICATE KEY UPDATE number = number + 1, winnings = winnings + VALUES(winnings), bet_total = bet_total + VALUES(bet_total);'
  return queryHelper(queryString, [userid, winnings, bet])
}

const betFunctions = {} as { [name: string]: (result: number) => boolean }
betFunctions.even = function (result) {
  return (result !== 0 && result % 2 === 0)
}

betFunctions.odd = function (result) {
  return (result !== 0 && result % 2 === 1)
}

betFunctions.black = function (result) {
  const BLACKS = [15, 4, 2, 17, 6, 13, 11, 8, 10, 24, 33, 20, 31, 22, 29, 28, 35, 26]
  return BLACKS.includes(result)
}

betFunctions.red = function (result) {
  const REDS = [32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3]
  return REDS.includes(result)
}

async function spinRoulette (client: Client, message: Message, betType: string | number, betAmount: number) {
  const coin = client.emojis.cache.get('631834832300670976')
  const result = parseInt(await client.executePython('roulette', []))

  message.channel.send(new MessageAttachment('./img/roulette.gif'))
  setTimeout(() => {
    message.channel.send(`The wheel came up: **${result}**`)
    if (typeof betType === 'string') {
      // Function bet
      if (betFunctions[betType](result)) {
        message.channel.send(`Congrats, ${message.member.displayName}! You won ${coin} **${betAmount * 2}**`)
        incrementArcadeCredits(message.member.id, betAmount * 2)
        updateRouletteStat(message.member.id, betAmount * 2, betAmount)
      } else {
        message.channel.send('Better luck next time!')
        updateRouletteStat(message.member.id, 0, betAmount)
      }
    } else {
      // Single number bet
      if (betType === result) {
        message.channel.send(`Congrats, ${message.member.displayName}! You won ${coin} **${betAmount * 35}**`)
        incrementArcadeCredits(message.member.id, betAmount * 35)
        updateRouletteStat(message.member.id, betAmount * 35, betAmount)
      } else {
        message.channel.send('Better luck next time!')
        updateRouletteStat(message.member.id, 0, betAmount)
      }
    }
  }, 6500)
}

module.exports = {
  name: 'roulette',
  description: 'Risk big on the roulette wheel!\nYou can bet on even, odd, or on a single number: `!roulette even` `!roulette 19`\nYou can also specify how much to bet (50 - 500 coins): `!roulette even 50` `!roulette 25 500`',
  cooldown: 20,

  async execute (client: Client, message: Message, args: string[]) {
    // Determine the type of bet being made
    // Players can either pick a single number OR one of the above bet functions
    let betType = args[0] as (string | number)
    if (!betFunctions[betType]) {
      const betNumber = parseInt(args[0])
      if (isNaN(betNumber) || betNumber < 0 || betNumber > 36) {
        message.channel.send('Please enter a number between 0 and 36')
        return
      }
      betType = betNumber
    }

    // Determine the amount of coins being bet
    // Can be between 50 and 500; defaults to 100 if no second argument
    let betAmount = 100
    if (args.length > 1) {
      const amount = parseInt(args[1])
      if (isNaN(amount)) {
        message.channel.send('Please enter a valid bet amount!')
        return -1
      } else if (amount < 50) {
        message.channel.send('You must bet at least **50** coins!')
        return -1
      } else if (amount > 500) {
        message.channel.send('You can only bet up to **500** coins.')
        return -1
      }

      // Set the bet amount if all else is fine
      betAmount = amount
    }

    // Check the user has enough credits
    const credits = await getArcadeCredits(message.member.id)
    if (credits < betAmount) {
      message.channel.send('You don\'t have enough coins for this!')
      return
    }

    const confirmMsg = await message.channel.send(`Are you sure you want to bet **${betAmount}** coins on **${betType}**?`)
    confirmMsg.react('✅')
    const filter = (reaction: MessageReaction, user: User) => {
      return user.id === message.member.id && reaction.emoji.name === '✅'
    }

    const collector = confirmMsg.createReactionCollector(filter, { time: 35000 })
    collector.on('collect', () => {
      // Confirmation received!
      collector.stop()
      confirmMsg.edit('Get ready!')
      confirmMsg.reactions.removeAll()

      // Spin the wheel
      incrementArcadeCredits(message.member.id, -betAmount)
      spinRoulette(client, message, betType, betAmount)
      client.updateCooldown(this, message.member.id)
    })
  }
}

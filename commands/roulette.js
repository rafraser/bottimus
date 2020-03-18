const arcade = require('../util/arcade')
const pool = require('../util/database')
const discord = require('discord.js')

const bet_functions = {}
bet_functions['even'] = function(result) {
  return (result != 0 && result % 2 == 0)
}

bet_functions['odd'] = function(result) {
  return (result != 0 && result % 2 == 1)
}

function spinRoulette(message, betType, betAmount) {

}

module.exports = {
  name: 'roulette',
  description: 'Roulette!',
  execute(message, args, client) {
    // Determine the type of bet being made
    // Players can either pick a single number OR one of the above bet functions
    const betType = args[0]
    if(!bet_functions[betType]) {
      let betNumber = parseInt(args[0])
      if (isNaN(betNumber) || betNumber < 0 || betNumber > 36) {
        message.channel.send('Please enter a number between 0 and 36')
        return
      }
    }

    // Determine the amount of coins being bet
    // Can be between 50 and 500; defaults to 100 if no second argument
    let betAmount = 100
    if(args.length > 1) {
      let amount = parseInt(args[1])
      if (isNaN(amount)) {
        message.channel.send('Please enter a valid bet amount!')
        return
      } else if(amount < 50) {
        message.channel.send('You must bet at least 50 coins!')
        return
      } else if(amount > 500) {
        message.channel.send('You can only bet up to 500 coins.')
        return
      }

      // Set the bet amount if all else is fine
      betAmount = amount
    }

    // Confirm before spinning the wheel
    message.channel.send(betType + ':' + betAmount)
    return


    client.executePython('roulette').then(function (data) {
      var attachment = new discord.Attachment('./img/roulette.gif')
      message.channel.send(attachment).then(function () {
        setTimeout(function () {
          message.channel.send(data)
        }, 6500)
      })
    }).catch(function (err) {
      message.channel.send(err.toString())
    })
  }
}

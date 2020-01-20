const arcade = require('../arcade')
const pool = require('../database')
const discord = require('discord.js')

function getLastSpin (id) {
  return new Promise(function (resolve, reject) {
    var queryString = 'SELECT lastspin FROM arcade_dailyspin WHERE discordid = ?'
    pool.query(queryString, [id], function (err, results) {
      if (err) {
        reject(err)
      } else {
        resolve(results)
      }
    })
  })
}

function updateLastSpin (id, date) {
  var queryString = 'INSERT INTO arcade_dailyspin VALUES(?, ?, 1) ON DUPLICATE KEY UPDATE lastspin = VALUES(lastspin), number = number + VALUES(number)'
  pool.query(queryString, [id, date])
}

function pickWheel () {
  var wheels = [
    // These wheels have an average payout of 200
    ['#coin 100', '#coin 200', '#coin 400', '#coin 200', '#coin 400', '#coin 100'],
    ['#coin 100', '#coin 100', '#coin 100', '#coin 100', '#coin 100', '#coin 100', '#coin 100', '#coin 100', '#coin 1000'],
    ['#coin 100', '#coin 200', '#coin 300'],
    ['#coin 100', '#coin 300', '#coin 100', '#coin 300', '#coin 100', '#coin 300', '#coin 100', '#coin 300'],
    ['#coin 100', '#coin 300', '#coin 100', '#coin 300', '#coin 100', '#coin 300', '#coin 100', '#coin 300'],
    ['#coin 25', '#coin 50', '#coin 300', '#coin 425', '#coin 425', '#coin 300', '#coin 50', '#coin 25'],
    // These wheels have an average payout of 300
    ['#coin 125', '#coin 125', '#coin 1000', '#coin 125', '#coin 125'],
    ['#coin 42', '#coin 42', '#coin 42', '#coin 42', '#coin 42', '#coin 1590'],
    ['#coin 100', '#coin 200', '#coin 300', '#coin 400', '#coin 500'],
    ['#coin 125', '#coin 125', '#coin 1000', '#coin 125', '#coin 125'],
    // These wheels have an average payout of 400
    ['#coin 600', '#coin 200'],
    ['#coin 325', '#coin 350', '#coin 400', '#coin 450', '#coin 475']
  ]

  return wheels[Math.floor(Math.random() * wheels.length)]
}

module.exports = {
  name: 'dailyspin',
  description: 'Spin a prize wheel once a day!',
  execute (message, args, client) {
    getLastSpin(message.member.id).then(function (results) {
      var lastspin = results[0]
      // If the user has previously spun the wheel, check that it's been 24 hours
      if (lastspin) {
        lastspin = results[0].lastspin
        var current = new Date()
        var elapsed = Math.abs(current - lastspin)
        var delay = 12 * 3600 * 1000
        if (elapsed < delay) {
          message.channel.send('Your next daily spin is in ' + client.timeToString(delay - elapsed))
          return
        }
      }

      message.channel.send('Get ready!')

      // Spin the wheel!
      var prizes = pickWheel()
      updateLastSpin(message.member.id, new Date())

      client.executePython('spinner', prizes).then(function (data) {
        var attachment = new discord.Attachment('./img/spinner.gif')
        message.channel.send(attachment).then(function () {
          setTimeout(function () {
            // After a short delay, announce the winning and award credits
            if (data.startsWith('ZERO')) {
              message.channel.send('Oh no :( Better luck next time!')
            } else {
              var amount = parseInt(data.replace('#coin ', ''), 10)
              var coin = client.emojis.get('631834832300670976')
              message.channel.send(`Congrats! You won ${coin} ${amount}`)
              arcade.incrementArcadeCredits(message.member.id, amount)
            }
          }, 6500)
        }).catch(function () {
          message.channel.send('The wheel broke :(')
        })
      })
    }).catch(function (err) {
      message.channel.send(err.toString())
    })
  }
}

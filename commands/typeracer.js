const words = require('../util/typeracer_words')
const arcade = require('../util/arcade')
const pool = require('../util/database')
const discord = require('discord.js')

// Stores results for players that complete the Type Race
function incrementStatScore(userid, speed) {
  const queryOne = 'INSERT INTO arcade_typeracer (discordid, completed, speed_average) VALUES(?, 1, ?) ON DUPLICATE KEY UPDATE speed_average = ((speed_average * completed) + VALUES(speed_average))/(completed + 1), completed = completed + 1;'
  const queryTwo = 'SELECT speed_best FROM arcade_typeracer WHERE discordid = ?;'
  const queryThree = 'UPDATE arcade_typeracer SET speed_best = ?, date_best = ? WHERE discordid = ?;'

  // callback hell I know
  return new Promise(function (resolve, reject) {
    pool.query(queryOne, [userid, speed], function (err, results) {
      if (err) { console.log(err); return }
      pool.query(queryTwo, [userid], function (err, results) {
        if (err) { console.log(err); return }
        const best = results[0].speed_best

        if (speed > best) {
          pool.query(queryThree, [speed, new Date(), userid], function (err) {
            if (err) console.log(err)
          })
          resolve([true, userid, speed])
        } else {
          resolve([false])
        }
      })
    })
  })
}

function shuffle(a) {
  let j, x, i
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1))
    x = a[i]
    a[i] = a[j]
    a[j] = x
  }

  return a
}

function isPlayingTyperacer(client, guild) {
  // Create the structure if it doesn't exist
  if (!client.typeracerSessions) {
    client.typeracerSessions = new discord.Collection()
  }

  return client.typeracerSessions.has(guild.id)
}

function setPlayingTyperacer(client, guild, active) {
  // Create the structure if it doesn't exist
  if (!client.typeracerSessions) {
    client.typeracerSessions = new discord.Collection()
  }

  // Update the collection
  if (active) {
    client.typeracerSessions.set(guild.id, true)
  } else {
    client.typeracerSessions.delete(guild.id)
  }
}

function messageFilter(m) {
  // Return all messages
  // These get proccessed when collected
  return (!m.member.user.bot)
}

function startTypeRacer(client, message, display) {
  const n = 30
  const hard = 5
  const list = shuffle(words.easy).slice(0, n - hard).concat(shuffle(words.hard).slice(0, hard))
  display.delete()

  client.executePython('typeracer', list.join(' ')).then(function () {
    // Send the image to the channel
    const attachment = new discord.Attachment('./img/typeracer.png')
    message.channel.send(attachment).then(function () {
      const starttime = new Date()
      let winners = new Map()

      const collector = message.channel.createMessageCollector(messageFilter, { time: 60000 })
      collector.on('collect', function (m) {
        // Check the message and see if it's a valid race response
        // Skip message if already won
        if (winners.get(m.member.id)) return

        const endtime = new Date()
        const attempt = m.content.split(' ')
        if (attempt.length < n) return

        // Check each word submitted by the user
        // They are allowed 2 mistakes out of 50 words (96% accuracy)
        let wrong = 0
        for (const i = 0; i < n; i++) {
          if (attempt[i].toLowerCase() === list[i].toLowerCase()) continue

          // Wrong word, oh no!
          wrong++
          if (wrong > 1) return
        }

        // Everything is fine!
        winners.set(m.member.id, endtime)

        // React to the message
        m.delete()
        m.channel.send('✅ ' + m.member.displayName + ' has completed the race!')
      })

      collector.on('end', function () {
        let letters = list.join(' ').length
        let place = 1
        let string = 'The race is over!\n'
        // Announce the winners
        for (const result of winners) {
          const member = message.guild.members.get(result[0])
          const finishtime = result[1]
          const duration = (finishtime - starttime) / 1000
          const wpm = Math.floor((letters / 5) * (60 / duration))

          // Award credits based on WPM
          let credits = 20 + Math.ceil(wpm / 2)
          if (credits <= 25) {
            credits = 25
          } else if (credits >= 75) {
            credits = 75
          }
          arcade.incrementArcadeCredits(result[0], credits)

          // Store data, announcing records when applicable
          incrementStatScore(result[0], wpm).then(function (record) {
            if (record[0]) {
              const id = record[1]
              const speed = record[2]
              const member = message.guild.members.get(id).displayName
              message.channel.send('⭐ ' + member + ' set a new record of ' + speed + ' WPM!')
            }
          })

          string += '#' + place + ') ' + member.displayName + ': ' + wpm + 'WPM\n'
          place++
        }

        message.channel.send(string)
        setPlayingTyperacer(client, message.guild, false)
      })
    })
  }).catch(function (e) { message.channel.send(e) })
}

module.exports = {
  name: 'typeracer',
  description: 'Play a game of Type Racer',
  aliases: ['typerace'],
  execute(message, args, client) {
    // Make sure each guild only has a single game going on
    if (isPlayingTyperacer(client, message.guild)) return
    setPlayingTyperacer(client, message.guild, true)

    message.channel.send('Get ready for Type Racer!').then(function (m) {
      // Small delay before starting to allow players time to prepare
      setTimeout(function () { m.edit('Type Racer starting in: 5') }, 5000)
      setTimeout(function () { m.edit('Type Racer starting in: 4') }, 6000)
      setTimeout(function () { m.edit('Type Racer starting in: 3') }, 7000)
      setTimeout(function () { m.edit('Type Racer starting in: 2') }, 8000)
      setTimeout(function () { m.edit('Type Racer starting in: 1') }, 9000)
      setTimeout(function () { startTypeRacer(client, message, m) }, 10000)
    })
  }
}

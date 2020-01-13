const events = require('../events')

const approvalChannel = '374834858821812234'

module.exports = {
  name: 'schedule',
  description: 'Request an event to be scheduled',
  aliases: ['planevent', 'requestevent'],
  execute (message, args, client) {
    if (message.guild.id != '309951255575265280') return

    if (!client.isCommunityStar(message.member)) {
      message.channel.send('You need to be a Moderator to use this!')
      return
    }

    // Create the locally stored events storage if it doesn't exist
    if (client.requestedEventsData == null) {
      client.requestedEventsData = []
    }

    // Attempt to parse the event format
    try {
      var title = args.shift()
      var description = args.shift()

      var now = new Date(Date.now())
      var datetime = {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate()
      }

      while (args.length >= 1) {
        var arg = args.shift()
        if (arg.includes(':')) {
          // Try parsing this argument as time
          arg = arg.split(':')
          datetime.hour = arg[0]
          datetime.minute = arg[1]
        } else if (arg.includes('-')) {
          // Try parsing this argument as YYYY-MM-DD
          arg = arg.split('-')
          datetime.year = arg[0]
          datetime.month = arg[1] - 1
          datetime.day = arg[2]
        } else if (arg.includes('/')) {
          // Try parsing this argument as DD/MM/YYYY
          arg = arg.split('/')
          datetime.day = arg[0]
          datetime.month = arg[1] - 1
          datetime.year = arg[2]
        }
      }

      // Check that the date and time are valid
      var when = new Date(datetime.year, datetime.month, datetime.day, datetime.hour, datetime.minute)
      if (!(when instanceof Date && !isNaN(when))) {
        message.channel.send('Invalid event structure. Check that the time is the right format (HH:MM)')
        return
      }
    } catch (e) {
      message.channel.send('Invalid event structure')
      return
    }

    // Generate an initial event embed
    var event = events.generateEvent(message.member, title, description, when)
    var timeLeft = client.timeToString(event.time - Date.now())
    var embed = events.generateEventEmbed(event, timeLeft)

    // Check that the event is correct before sending
    message.channel.send('Is this correct?', embed).then(function (msg) {
      msg.react('✅')
      const filter = function (reaction, user) {
        return user.id == message.member.id && reaction.emoji.name == '✅'
      }

      var collector = msg.createReactionCollector(filter, { time: 15000 })
      collector.on('collect', function () {
        // Confirmation received!
        collector.stop()
        client.requestedEventsData.push(event)

        var channel = client.channels.get(approvalChannel)
        channel.send(`New event requested by **${message.member.displayName}**!`)

        msg.delete()
        msg.channel.send('Event has been sent to Administrators for approval!')
      })
    })
  }
}

const events = require('../util/events')

const approvalChannel = '374834858821812234'

module.exports = {
  name: 'schedule',
  description: 'Request an event to be scheduled',
  aliases: ['planevent', 'requestevent'],
  guilds: ['309951255575265280'],
  execute(message, args, client) {
    if (!client.isCommunityStar(message.member)) {
      message.channel.send('You need to be a Moderator to use this!')
      return
    }

    // Create the locally stored events storage if it doesn't exist
    if (client.requestedEventsData == null) {
      client.requestedEventsData = []
    }

    // Prepare variables
    let title, description, when

    // Attempt to parse the event format
    try {
      title = args.shift()
      description = args.shift()

      const now = new Date(Date.now())
      let datetime = {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate()
      }

      while (args.length >= 1) {
        let arg = args.shift()
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
      when = new Date(datetime.year, datetime.month, datetime.day, datetime.hour, datetime.minute)
      if (!(when instanceof Date && !isNaN(when))) {
        message.channel.send('Invalid event structure. Check that the time is the right format (HH:MM)')
        return
      }
    } catch (e) {
      message.channel.send('Invalid event structure')
      return
    }

    // Generate an initial event embed
    const event = events.generateEvent(message.member, title, description, when)
    const timeLeft = client.timeToString(event.time - Date.now(), 2)
    const embed = events.generateEventEmbed(event, timeLeft)

    // Check that the event is correct before sending
    message.channel.send('Is this correct?', embed).then(function (msg) {
      msg.react('✅')
      const filter = function (reaction, user) {
        return user.id === message.member.id && reaction.emoji.name === '✅'
      }

      const collector = msg.createReactionCollector(filter, { time: 15000 })
      collector.on('collect', function () {
        // Confirmation received!
        collector.stop()
        client.requestedEventsData.push(event)

        const channel = client.channels.get(approvalChannel)
        channel.send(`New event requested by **${message.member.displayName}**!`)

        msg.delete()
        msg.channel.send('Event has been sent to Administrators for approval!')
      })
    })
  }
}

module.exports = {
  name: 'eventlist',
  description: 'Get a brief list of what events are upcoming',
  aliases: ['events'],
  cooldown: 10,
  execute (message, args, client) {
    if (!client.eventsData || client.eventsData.size < 1) {
      message.channel.send('No events are currently scheduled!')
      return
    }

    // Sort the events by whichever is soonest
    const sortedEvents = client.eventsData.sort(function (a, b) {
      return a.time - b.time
    }).array()

    // Generate a code block list
    let outputString = '```cs\n# Upcoming Events #'
    sortedEvents.forEach(function (item, index) {
      console.log(item.time, index)
      outputString += '\n ' + (index + 1) + '. ' + item.title
    })
    outputString += '```'
    message.channel.send(outputString)
  }
}

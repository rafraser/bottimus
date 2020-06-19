const discord = require('discord.js')
const pool = require('../util/database')

function addEventHistory(event, reactions) {
  const queryString = 'INSERT INTO event_history VALUES(?, ?, ?, ?)'
  pool.query(queryString, [event.time, event.title, event.category, reactions])
}

function formatEventDate(date, newline = true) {
  // Robert A Fraser elite coding skills right here
  // Look I know this sucks but Fluffy Servers events will always be running in Sydney time
  // We really only need this to get the tag at the end correct
  // Blame that one guy in my Discord that nitpicked me about this
  let timezone = 'AEST'
  if (timezone == 'AEST' && date.getTimezoneOffset() === -660) {
    timezone = 'AEDT'
  }

  let timeString = date.toLocaleString('en-GB', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  if (newline) {
    return timeString.replace(',', '\n') + ' ' + timezone
  } else {
    return timeString + ' ' + timezone
  }
}
// https://fluffyservers.com/img/events/

const eventList = {
  art: true,
  csgo: true,
  death: true,
  deathrun: true,
  dodgeball: true,
  dota: true,
  gmod: true,
  golf: true,
  hidden: true,
  jackbox: true,
  league: true,
  mapping: true,
  minecraft: true,
  minigames: true,
  movie: true,
  murder: true,
  music: true,
  overwatch: true,
  racing: true,
  sandbox: true,
  stream: true,
  switch: true,
  testing: true,
  tower: true,
  voice: true,
  zombie: true
}

function getEventCategory(event, forcetype) {
  // If force, check it's a valid type
  if (forcetype && eventList[forcetype]) {
    return forcetype
  }

  // Scan all the words to spot the first category
  const words = event.title.split(' ').concat(event.description.split(' '))
  for (let word of words) {
    word = word.toLowerCase()
    if (eventList[word]) {
      return word
    }
  }

  // Default to generic
  return 'generic'
}

function findEventIcon(event) {
  return `https://fluffyservers.com/img/events/${event.category}.gif`
}

function generateEventEmbed(event, timeLeft) {
  const formattedTime = formatEventDate(event.time)
  const image = findEventIcon(event)
  const embed = new discord.MessageEmbed()
    .setColor('#f0932b')
    .setTitle(event.title)
    .setDescription(event.description)
    .setThumbnail(image)
    .addField('Starting in:', timeLeft || 'N/A', false)
    .addField('Scheduled by:', event.scheduler, true)
    .addField('Time:', formattedTime, true)
    .setFooter('Click the bell to be pinged when this event starts')
  return embed
}

function generateCompletedEventEmbed(event) {
  const formattedTime = formatEventDate(event.time)
  const image = findEventIcon(event)
  const embed = new discord.MessageEmbed()
    .setColor('#f0932b')
    .setTitle(event.title)
    .setThumbnail(image)
    .setDescription(event.description)
    .addField('Scheduled by:', event.scheduler, true)
    .addField('Time:', formattedTime, true)
  return embed
}

function generateEvent(member, title, description, time, forcetype) {
  const event = {}
  event.scheduler = member.displayName
  event.title = title
  event.description = description
  event.time = time
  event.category = getEventCategory(event, forcetype)

  return event
}

function getSortedEvents(client) {
  // Sort the events by whichever is soonest
  return client.eventsData.sort((a, b) => {
    return a.time - b.time
  }).array()
}

function getNextEvent(client) {
  const events = getSortedEvents(client)
  return events.find(e => !e.complete)
}

function generateCalendar(client) {
  return new Promise((resolve, reject) => {
    if (!client.eventsData || client.eventsData.size < 1) {
      reject(new Error('No events are currently scheduled'))
    }

    let events2 = []
    for (let event of client.eventsData.values()) {
      events2.push(`${event.time.toUTCString()}.${event.category}.${event.title}`)
    }

    client.executePython('calendar_display', events2).then(() => {
      resolve('./img/calendar.png')
    })
  })
}

module.exports.addEventHistory = addEventHistory
module.exports.formatEventDate = formatEventDate
module.exports.generateEventEmbed = generateEventEmbed
module.exports.generateCompletedEventEmbed = generateCompletedEventEmbed
module.exports.generateEvent = generateEvent
module.exports.getSortedEvents = getSortedEvents
module.exports.getNextEvent = getNextEvent
module.exports.generateCalendar = generateCalendar
module.exports.eventCategories = eventList
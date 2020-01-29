const discord = require('discord.js')

function formatEventDate(date) {
  return date.toLocaleString('en-GB', { timezone: 'AEDT', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '\n') + ' AEDT'
}
// https://fluffyservers.com/img/events/

const eventList = {
  sandbox: true,
  jackbox: true,
  murder: true,
  minigames: true,
  testing: true,
  mapping: true,
  music: true,
  streaming: true,
  hidden: true
}

function getEventCategory(event) {
  const words = event.title.split(' ').concat(event.description.split(' '))
  let gmod = false

  // Scan all the words to spot the first category
  for (let word of words) {
    word = word.toLowerCase()
    if (eventList[word]) {
      return word
    } else if (word === 'gmod') {
      gmod = true
    }
  }

  // If no specific event was mentioned;
  // check if it's a Garry's Mod or a generic event
  if (gmod) {
    return 'gmod'
  } else {
    return 'generic'
  }
}

function findEventIcon(event) {
  return `https://fluffyservers.com/img/events/${event.category}.gif`
}

function generateEventEmbed(event, timeLeft) {
  const formattedTime = formatEventDate(event.time)
  const image = findEventIcon(event)
  const embed = new discord.RichEmbed()
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
  const embed = new discord.RichEmbed()
    .setColor('#f0932b')
    .setTitle(event.title)
    .setThumbnail(image)
    .setDescription(event.description)
    .addField('Scheduled by:', event.scheduler, true)
    .addField('Time:', formattedTime, true)
  return embed
}

function generateEvent(member, title, description, time) {
  const event = {}
  event.scheduler = member.displayName
  event.title = title
  event.description = description
  event.time = time
  event.category = getEventCategory(event)

  return event
}

function getSortedEvents(client) {
  // Sort the events by whichever is soonest
  return client.eventsData.sort(function (a, b) {
    return a.time - b.time
  }).array()
}

function getNextEvent(client) {
  const events = getSortedEvents(client)
  return events.find(e => !e.complete)
}

module.exports.generateEventEmbed = generateEventEmbed
module.exports.generateCompletedEventEmbed = generateCompletedEventEmbed
module.exports.generateEvent = generateEvent
module.exports.getSortedEvents = getSortedEvents
module.exports.getNextEvent = getNextEvent

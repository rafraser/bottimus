const discord = require('discord.js')

function formatEventDate (date) {
  return date.toLocaleString('en-GB', { timezone: 'AEDT', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '\n') + ' AEDT'
}

const eventIcons = {
  sandbox: 'https://fluffyservers.com/img/events/sandbox.gif',
  jackbox: 'https://fluffyservers.com/img/events/jackbox.gif',
  murder: 'https://fluffyservers.com/img/events/murder.gif',
  minigames: 'https://fluffyservers.com/img/events/minigames.gif',
  testing: 'https://fluffyservers.com/img/events/testing.gif'
}

function findEventIcon (event) {
  const words = event.title.split(' ').concat(event.description.split(' '))
  let gmod = false

  // Scan all the words to spot the first category
  for (let word of words) {
    word = word.toLowerCase()
    if (eventIcons[word]) {
      return eventIcons[word]
    } else if (word === 'gmod') {
      gmod = true
    }
  }

  // No specific event mentioned; check if Garry's Mod or generic event
  if (gmod) {
    return 'https://fluffyservers.com/img/events/gmod.gif'
  } else {
    return 'https://fluffyservers.com/img/events/generic.gif'
  }
}

function generateEventEmbed (event, timeLeft) {
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

function generateCompletedEventEmbed (event) {
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

function generateEvent (member, title, description, time) {
  const event = {}
  event.scheduler = member.displayName
  event.title = title
  event.description = description
  event.time = time

  return event
}

module.exports.generateEventEmbed = generateEventEmbed
module.exports.generateCompletedEventEmbed = generateCompletedEventEmbed
module.exports.generateEvent = generateEvent

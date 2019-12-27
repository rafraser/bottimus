const pool = require('./database')
const discord = require('discord.js')

function formatEventDate(date) {
    return date.toLocaleString('en-GB', {timezone: 'AEST', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'}).replace(',', '\n') + ' AEST'
}

const eventIcons = {
    'scp': 'https://fluffyservers.com/img/events/scp.png',
    'sandbox': 'https://fluffyservers.com/img/events/sandbox.png',
    'jackbox': 'https://fluffyservers.com/img/events/jackbox.png',
    'murder': 'https://fluffyservers.com/img/events/murder.png',
    'minigames': 'https://fluffyservers.com/img/events/minigames.png',
}

function findEventIcon(event) {
    var words = event.title.split(' ').concat(event.description.split(' '))
    var gmod = false

    // Scan all the words to spot the first category
    for(var word of words) {
        word = word.toLowerCase()
        if(eventIcons[word]) {
            return eventIcons[word]
        } else if(word == 'gmod') {
            gmod = true
        }
    }

    // No specific event mentioned; check if Garry's Mod or generic event
    if(gmod) {
        return 'https://fluffyservers.com/img/events/gmod.png'
    } else {
        return 'https://fluffyservers.com/img/events/generic.png'
    }
}

function generateEventEmbed(event, timeLeft) {
    var formattedTime = formatEventDate(event.time)
    var image = findEventIcon(event)
    var embed = new discord.RichEmbed()
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
    var formattedTime = formatEventDate(event.time)
    var image = findEventIcon(event)
    var embed = new discord.RichEmbed()
    .setColor('#f0932b')
    .setTitle(event.title)
    .setThumbnail(image)
    .setDescription(event.description)
    .addField('Scheduled by:', event.scheduler, true)
    .addField('Time:', formattedTime, true)
    return embed
}

function generateEvent(member, title, description, time) {
    var event = {}
    event.scheduler = member.displayName
    event.title = title
    event.description = description
    event.time = time

    return event
}

module.exports.generateEventEmbed = generateEventEmbed
module.exports.generateCompletedEventEmbed = generateCompletedEventEmbed
module.exports.generateEvent = generateEvent
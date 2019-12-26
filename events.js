const pool = require('./database')
const discord = require('discord.js')

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
function formatEventDate(date) {
    return date.toLocaleString('en-GB', {timezone: 'AEST', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'}).replace(',', '\n') + ' AEST'
}

function generateEventEmbed(event, timeLeft) {
    var formattedTime = formatEventDate(event.time)
    var embed = new discord.RichEmbed()
    .setColor('#f0932b')
    .setTitle(event.title)
    .setDescription(event.description)
    .addField('Starting in:', timeLeft || 'N/A', false)
    .addField('Scheduled by:', event.scheduler, true)
    .addField('Time:', formattedTime, true)
    .setFooter('Click the bell to be pinged when this event starts')
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
module.exports.generateEvent = generateEvent
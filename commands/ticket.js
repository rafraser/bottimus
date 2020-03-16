const discord = require('discord.js')
const fs = require('fs')

function ticketUser(client, member, duration, muter, channel) {
  // Get the ticket role from guild role info
  const roleData = client.serverRoles.get(channel.guild.id)
  if (!roleData) return
  if (!roleData.ticket) return
  const ticketID = roleData.ticket

  // Create the locally stored tickets storage if it doesn't exist
  if (client.ticketData == null) {
    client.ticketData = new discord.Collection()
  }

  // Setup the options for the mute
  let options = {
    guild: member.guild.id,
    revoke: new Date(Date.now() + duration * 60000),
    channel: channel.id,
    member: member.id
  }
  client.ticketData.set(member.guild.id + ',' + member.id, options)

  // Add the ticket role
  member.addRole(member.guild.roles.get(ticketID))

  // Write a data file in case of restarting
  client.writeDataFile('tickets', member.guild.id + ',' + member.id, options)
}

function unticketUser(client, id) {
  const settings = client.ticketData.get(id)
  const guild = client.guilds.get(settings.guild)
  const member = guild.members.get(settings.member)
  const channel = guild.channels.get(settings.channel)
  client.ticketData.delete(id)

  // Get the ticket role from guild role info
  const roleData = client.serverRoles.get(channel.guild.id)
  if (!roleData) return
  if (!roleData.ticket) return
  const ticketID = roleData.ticket

  // Delete the ticket data file (if it exists)
  try {
    fs.unlink('data/tickets/' + member.guild.id + ',' + member.id + '.json', function (e) { })
  } catch (e) { }

  // Abort if the member doesn't exist
  if (!member) {
    return
  }
  member.removeRole(member.guild.roles.get(ticketID))
}

module.exports = {
  name: 'ticket',
  description: '🛡️ Assign a temporary ticket to a user',
  ticket: ticketUser,
  unticket: unticketUser,
  guilds: ['309951255575265280'],
  execute(message, args, client) {
    // Check that the user has permission
    if (!client.isAdministrator(message.member)) {
      message.channel.send('You need to be an Administrator to use this!')
      return
    }

    try {
      const target = client.findUser(message, args)

      // Search the arguments until a duration is found
      let duration = null
      for (let i = 0; i < args.length; i++) {
        let a = args[i]
        a = parseInt(a, 10)

        if (!isNaN(a)) {
          duration = a
          break
        }
      }

      // Hour long ticket if duration could not be found
      if (duration == null || isNaN(duration)) {
        duration = 60
      }

      // Handle the ticket role process
      if (client.ticketData && client.ticketData.has(message.guild.id + ',' + target.id)) {
        message.channel.send('Ticket revoked!')
      } else {
        ticketUser(client, target, duration, message.member, message.channel)

        // Send a cool mute embed
        let embed = new discord.RichEmbed()
          .setColor('#ff9f43')
          .setTitle('🎟️ ' + target.displayName + ' has a ticket 🎟️')
          .setDescription('It is valid for the next ' + client.timeToString(duration * 60 * 1000))
        message.channel.send(embed)
      }
    } catch (error) {
      message.channel.send(error.message)
    }
  }
}
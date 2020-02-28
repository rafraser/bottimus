const discord = require('discord.js')
const fs = require('fs')

function muteUser(client, member, duration, muter, channel) {
  let roles = member.roles
  let roleIDs = roles.map(role => role.id)

  // Get the muted role from guild role info
  const roleData = client.serverRoles.get(channel.guild.id)
  if (!roleData) return
  if (!roleData.muted) return
  const muteID = roleData.muted

  // Create the locally stored mutes storage if it doesn't exist
  if (client.mutesData == null) {
    client.mutesData = new discord.Collection()
  }

  // Setup the options for the mute
  let options = {
    guild: member.guild.id,
    roles: roleIDs,
    unmute: new Date(Date.now() + duration * 60000),
    muter: muter.id,
    channel: channel.id,
    member: member.id
  }
  client.mutesData.set(member.guild.id + ',' + member.id, options)

  // Remove all roles, then add muted role
  // We need this forEach loop vs removeRoles in the case of un-removable roles
  // eg. Nitro Boost
  roles.forEach(function (role) {
    if (role.id === muteID) return
    member.removeRole(role).catch(function (e) { })
  })
  member.addRole(member.guild.roles.get(muteID))

  // Write a data file in case of restarting
  client.writeDataFile('mutes', member.guild.id + ',' + member.id, options)
}

function unmuteUser(client, id) {
  const settings = client.mutesData.get(id)
  const guild = client.guilds.get(settings.guild)
  const member = guild.members.get(settings.member)
  const channel = guild.channels.get(settings.channel)
  client.mutesData.delete(id)

  // Get the muted role from guild role info
  const roleData = client.serverRoles.get(channel.guild.id)
  if (!roleData) return
  if (!roleData.muted) return
  const muteID = roleData.muted

  // Delete the mute data file (if it exists)
  try {
    fs.unlink('data/mutes/' + member.guild.id + ',' + member.id + '.json', function (e) { })
  } catch (e) { }

  // Abort if the member doesn't exist
  if (!member) {
    return
  }

  // Add roles back, then removed muted role
  settings.roles.forEach(function (id) {
    const role = guild.roles.get(id)
    member.addRole(role).catch(function (e) { })
  })
  member.removeRole(member.guild.roles.get(muteID))

  // Reply message
  try {
    channel.send(member.displayName + ' has been unmuted')
  } catch (e) { }
}

module.exports = {
  name: 'mute',
  description: '🛡️ Mute a specified user',
  aliases: ['banish', 'void'],
  mute: muteUser,
  unmute: unmuteUser,
  guilds: ['309951255575265280'],
  execute(message, args, client) {
    // Check that the user has permission
    if (!client.isModerator(message.member)) {
      message.channel.send('You need to be a Moderator to use this!')
      return
    }

    try {
      // Don't mute administrators
      const target = client.findUser(message, args)
      if (client.isAdministrator(target)) {
        message.channel.send('You cannot mute Administrators!')
        return
      }

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

      // Half hour mute if duration could not be found
      if (duration == null || isNaN(duration)) {
        duration = 30
      }

      // Handle muting process in the above functions
      if (client.mutesData.has(message.guild.id + ',' + target.id)) {
        unmuteUser(client, message.guild.id + ',' + target.id)
      } else {
        muteUser(client, target, duration, message.member, message.channel)

        // Send a cool mute embed
        let embed = new discord.RichEmbed()
          .setColor('#c0392b')
          .setTitle('🦀 ' + target.displayName + ' is gone 🦀')
          .setDescription('They have been banished to the void for ' + client.timeToString(duration * 60 * 1000))
        message.channel.send(embed)
      }
    } catch (error) {
      message.channel.send(error.message)
    }
  }
}

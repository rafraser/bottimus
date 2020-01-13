const discord = require('discord.js')

module.exports = {
  name: 'role',
  description: 'Assign a role to yourself',
  aliases: ['roleme', 'assign', 'setrole'],
  execute (message, args) {
    if (message.guild.id != '309951255575265280') return

    // Handle no arguments with some help text
    if (!args.length || args.length < 1) {
      message.channel.send('Please select at least one role:```yaml\nevent\nmapping\nminigames\nscp```')
      return
    }

    var user = message.member
    var messageStack = ''

    // Add roles where appropiate
    // Todo: simplify this
    for (var role of args) {
      if (role.includes('event')) {
        // Assign the events related role
        var roleID = '535346825423749120'
        var role = message.guild.roles.get(roleID)
        if (user.roles.has(roleID)) {
          user.removeRole(role)
          messageStack += 'You won\'t get event notifications anymore. :(\n'
        } else {
          user.addRole(role)
          messageStack += 'Thanks for signing up for events!\n'
        }
      } else if (role.includes('map') || role.includes('hammer')) {
        // Assign the mapping related role
        var roleID = '514727746006679552'
        var role = message.guild.roles.get(roleID)
        if (user.roles.has(roleID)) {
          user.removeRole(role)
          messageStack += 'Sorry to see you leave #mapping :(\n'
        } else {
          user.addRole(role)
          messageStack += 'Welcome to #mapping!\n'
        }
      } else if (role.includes('mini')) {
        // Assign the mapping related role
        var roleID = '621421798478839819'
        var role = message.guild.roles.get(roleID)
        if (user.roles.has(roleID)) {
          user.removeRole(role)
          messageStack += 'Sorry to see you leave Minigames :(\n'
        } else {
          user.addRole(role)
          messageStack += 'Thanks for joining the Minigames beta!\n'
        }
      } else if (role.includes('scp')) {
        var roleID = '653083644256190485'
        var role = message.guild.roles.get(roleID)
        if (user.roles.has(roleID)) {
          user.removeRole(role)
          messageStack += 'Sorry to see you leave #scp :(\n'
        } else {
          user.addRole(role)
          messageStack += 'Welcome to the SCP Foundation!\n'
        }
      }
    }

    message.channel.send(messageStack)
  }
}

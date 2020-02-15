module.exports = {
  name: 'role',
  description: 'Assign a role to yourself',
  aliases: ['roleme', 'assign', 'setrole'],
  guilds: ['309951255575265280'],
  execute(message, args) {
    if (message.guild.id !== '309951255575265280') return

    // Handle no arguments with some help text
    if (!args.length || args.length < 1) {
      message.channel.send('Please select at least one role:```yaml\nevent\nmapping\nminigames```')
      return
    }

    var user = message.member
    var messageStack = ''

    // Add roles where appropiate
    // Todo: simplify this
    // Todo but bolder: simplify this
    // seriously this could just be a dictionary or something
    for (var role of args) {
      if (role.includes('event')) {
        // Assign the events related role
        const roleID = '535346825423749120'
        const role = message.guild.roles.get(roleID)
        if (user.roles.has(roleID)) {
          user.removeRole(role)
          messageStack += 'You won\'t get event notifications anymore. :(\n'
        } else {
          user.addRole(role)
          messageStack += 'Thanks for signing up for events!\n'
        }
      } else if (role.includes('mini')) {
        // Assign the mapping related role
        const roleID = '621421798478839819'
        const role = message.guild.roles.get(roleID)
        if (user.roles.has(roleID)) {
          user.removeRole(role)
          messageStack += 'Sorry to see you leave Minigames :(\n'
        } else {
          user.addRole(role)
          messageStack += 'Thanks for joining the Minigames beta!\n'
        }
      }
    }

    message.channel.send(messageStack)
  }
}

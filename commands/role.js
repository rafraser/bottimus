// 
function generateHelpText(message, roleData) {
  let helpString = ''

  // Add help text for each role group
  for (let group of roleData.choices) {
    // Description based on group settings
    const name = "**" + (group.name || "Basic") + "**"
    if (group.many && group.required) {
      helpString += `Choose at least one ${name} role`
    } else if (group.many) {
      helpString += `Choose any number of ${name} roles:`
    } else {
      helpString += `Choose only one ${name} role:`
    }

    // List roles in group
    let roleOptions = Object.keys(group.options).join(" ")
    helpString += `\`\`\`css\n${roleOptions}\`\`\`\n`
  }

  message.channel.send(helpString)
}

// Helper function to get the set difference of two arrays
function symmetricDifference(a, b) {
  return a.filter(x => !b.includes(x))
    .concat(b.filter(x => !a.includes(x)))
}

// Helper function to get elements which are in A but not B
function monoDifference(a, b) {
  return a.filter(x => !b.includes(x))
}

// Helper function to get the intersection of two arrays
function intersection(a, b) {
  return a.filter(x => b.includes(x))
}

module.exports = {
  name: 'role',
  description: 'Assign a role to yourself',
  aliases: ['roleme', 'assign', 'setrole'],
  cooldown: 15,
  execute(message, args, client) {
    const user = message.member
    const roleData = client.serverRoles.get(user.guild.id)
    if (!roleData) return
    if (!roleData.choices) return

    // Handle no arguments with some help text
    if (!args.length || args.length < 1) {
      generateHelpText(message, roleData)
      return
    }

    // Make sure we don't get a whole bunch of roles given
    // We use a pretty messy for loop in this command
    // and we don't want things to get out of hand
    if (args.length > 5) {
      message.channel.send('Please limit role changes to 5 at a time')
      return
    }

    const userRoles = message.member.roles
    let messageStack = ''
    for (let group of roleData.choices) {
      const name = (group.name || "Basic")
      const groupRoles = Object.values(group.options)
      const groupRoleNames = Object.keys(group.options)

      // This is slightly messy I know
      // This basically turns both arrays we have into two arrays exclusively made of role IDs
      // This allows us to perform set operations on them later
      const currentRoles = userRoles.array().filter(role => groupRoles.includes(role.id)).map(role => role.id)
      const requestedRoles = args.filter(role => groupRoleNames.includes(role)).map(role => group.options[role])
      if (!requestedRoles || requestedRoles.length < 1) continue

      // Check that we don't end up in an invalid condition!
      const resultRoles = symmetricDifference(currentRoles, requestedRoles)
      if (resultRoles.length < 1 && group.required) {
        messageStack += `You need to have at least one ${name} role.\n`
        continue
      } else if (resultRoles.length > 1 && !group.many) {
        messageStack += `You can only have one ${name} role.\n`
        continue
      }

      // Everything is going smoothly, add and remove roles as required
      const rolesToRemove = intersection(requestedRoles, currentRoles)
      const rolesToAdd = monoDifference(requestedRoles, currentRoles)

      if (rolesToAdd && rolesToRemove && rolesToAdd.length >= 1 && rolesToRemove.length >= 1) {
        // This bit frustrates me, but without doing things this way Discord throws in phantom roles
        user.removeRoles(rolesToRemove.map(id => user.guild.roles.get(id))).then(function () {
          user.addRoles(rolesToAdd.map(id => user.guild.roles.get(id)))
        })
      } else if (rolesToRemove && rolesToRemove.length >= 1) {
        // Remove roles (no roles are added)
        user.removeRoles(rolesToRemove.map(id => user.guild.roles.get(id)))
      } else if (rolesToAdd && rolesToAdd.length >= 1) {
        // Add roles (no roles are removed)
        user.addRoles(rolesToAdd.map(id => user.guild.roles.get(id)))
      }

      // If applicable, add and remove the category role as required
      // Catch exceptions instead of checking for the role because it's faster
      if (group.category && resultRoles.length >= 1) {
        const categoryRole = message.guild.roles.get(group.category)
        user.addRole(categoryRole).catch()
      } else if (group.category && resultRoles.length < 1) {
        const categoryRole = message.guild.roles.get(group.category)
        user.removeRole(categoryRole).catch()
      }

      messageStack += `Updated your ${name} role(s).\n`
    }

    message.channel.send(messageStack)
  }
}

import { GuildMember } from 'discord.js'
import { Client, Message } from '../command'
import { RoleGroup, getChooseableRoles } from '../settings'

function limitString (min: number, max: number) {
  if (min && max) {
    if (min === max) {
      return `exactly ${max}`
    } else {
      return `${min}-${max}`
    }
  } else if (max) {
    return `up to ${max}`
  } else if (min) {
    return `at least ${min}`
  } else {
    return 'any number of'
  }
}

function generateHelpText (message: Message, choices: RoleGroup[]) {
  let helpString = ''

  // Add help text for each role group
  for (const group of choices) {
    // Description based on group settings
    const name = (group.name || 'Basic')

    // Display sizing guidelines
    helpString += `Choose ${limitString(group.min, group.max)} *${name}* role(s):`

    // List roles in group
    const roleOptions = Object.keys(group.options).join(' ')
    helpString += `\`\`\`css\n${roleOptions}\`\`\`\n`
  }

  message.channel.send(helpString)
}

// Helper function to get the set difference of two arrays
function symmetricDifference (a: any[], b: any[]) {
  return a.filter(x => !b.includes(x))
    .concat(b.filter(x => !a.includes(x)))
}

// Helper function to get elements which are in A but not B
function monoDifference (a: any[], b: any[]) {
  return a.filter(x => !b.includes(x))
}

// Helper function to get the intersection of two arrays
function intersection (a: any[], b: any[]) {
  return a.filter(x => b.includes(x))
}

export async function requestRoles (choices: RoleGroup[], member: GuildMember, roleArgs: string[]) {
  const userRoles = member.roles.cache
  let messageStack = ''
  let addStack = [] as string[]
  let removeStack = [] as string[]

  for (const group of choices) {
    const name = (group.name || 'Basic')
    const groupRoles = Object.values(group.options)
    const groupRoleNames = Object.keys(group.options)

    // This is slightly messy I know
    // This basically turns both arrays we have into two arrays exclusively made of role IDs
    // This allows us to perform set operations on them later
    const currentRoles = [...userRoles.values()].filter(role => groupRoles.includes(role.id)).map(role => role.id)
    const requestedRoles = roleArgs.filter(role => groupRoleNames.includes(role)).map(role => group.options[role])
    if (!requestedRoles || requestedRoles.length < 1) continue

    // Check that we don't end up in an invalid condition!
    const resultRoles = symmetricDifference(currentRoles, requestedRoles)
    if ((group.max && resultRoles.length > group.max) || (group.min && resultRoles.length < group.min)) {
      // We're hitting limits - let's try looking at this a different way
      // Instead of toggling roles, let's assume we're entirely replacing the group
      const intersectionRoles = intersection(requestedRoles, currentRoles)
      if (intersectionRoles.length === 0 && !((group.max && requestedRoles.length > group.max) || (group.min && requestedRoles.length < group.min))) {
        // Replace role group
        removeStack = removeStack.concat(currentRoles)
        addStack = addStack.concat(requestedRoles)

        messageStack += `Replaced your **${name}** role(s).\n`
      } else {
        messageStack += `You need ${limitString(group.min, group.max)} *${name}* role(s).\n`
      }
    } else {
      // Track changes in the stacks
      // We have to apply changes all at once or else some information will get lost
      removeStack = removeStack.concat(intersection(requestedRoles, currentRoles))
      addStack = addStack.concat(monoDifference(requestedRoles, currentRoles))

      // Check for category role situations and ensure this gets added and removed when needed
      if (group.category) {
        const hasCategory = userRoles.some(role => role.id === group.category)
        if (hasCategory && resultRoles.length === 0) {
          removeStack.push(group.category)
        } else if (!hasCategory && resultRoles.length >= 1) {
          addStack.push(group.category)
        }
      }

      messageStack += `Updated your **${name}** role(s).\n`
    }
  }

  // Error message if no valid roles are given
  if (!messageStack) {
    return 'Please specify valid roles.'
  }

  // Roles have been processed, now apply our changes
  member.roles.remove(removeStack).catch((e) => console.error(e)).finally(() => {
    member.roles.add(addStack)
  })
  return messageStack
}

export default {
  name: 'role',
  description: 'Assign a role to yourself',
  aliases: ['roleme', 'assign', 'setrole'],
  cooldown: 10,

  async execute (client: Client, message: Message, args: string[]) {
    const choices = getChooseableRoles(client.serverSettings, message.guild.id)
    if (!choices) return

    // Handle no arguments with some help text
    if (!args.length || args.length < 1) {
      generateHelpText(message, choices)
      return -1
    }

    // Make sure we don't get a whole bunch of roles given
    // We use a pretty messy for loop in this command
    // and we don't want things to get out of hand
    if (args.length > 5) {
      message.channel.send('Please limit role changes to 5 at a time')
      return -1
    }

    // Request the changes & print out the message
    const resultMessage = await requestRoles(choices, message.member, args)
    message.channel.send(resultMessage)
    client.updateCooldown(this, message.member.id)
  }
}

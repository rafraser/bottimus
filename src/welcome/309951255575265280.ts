import { GuildMember, TextChannel } from 'discord.js'

export default (member: GuildMember) => {
  const chan = member.guild.channels.cache.find((ch) => ch.name === 'general') as TextChannel
  chan.send(`Welcome to Fluffy Servers, ${member.displayName}! Please check out <#528849382196379650>`)
  member.roles.add('535346825423749120')
}

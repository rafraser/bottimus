import { GuildMember, TextChannel } from "discord.js"

export default (member: GuildMember) => {
    const chan = member.guild.channels.cache.find((ch) => ch.name === 'general') as TextChannel
    chan.send(`Welcome to the GMod Mapping Community, ${member.displayName}! \nCheck out <#677946457629917234> for a list of guidelines.\nDon't be afraid to share your work in <#677946357742436358>`)
    member.roles.add('680380116685291520')
}
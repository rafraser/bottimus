module.exports = function(member) {
  const chan = member.guild.channels.find((ch) => ch.name === 'general')
  chan.send(`Welcome to the GMod Mapping Community, ${member.displayName}! Don't be afraid to share your work in <#677946357742436358>`)
}
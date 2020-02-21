module.exports = function(member) {
  const chan = member.guild.channels.find((ch) => ch.name === 'general')
  chan.send(`Welcome to the GMod Mapping Community, ${member.displayName}! \nCheck out <#677946457629917234> for a list of guidelines.\nDon't be afraid to share your work in <#677946357742436358>`)
  member.addRole('680380116685291520')
}
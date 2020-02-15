module.exports = function(member) {
  const chan = member.guild.channels.find((ch) => ch.name === 'general')
  chan.send(`Welcome to Fluffy Servers, ${member.displayName}! Please check out <#528849382196379650>`)
  member.addRole('535346825423749120')
}
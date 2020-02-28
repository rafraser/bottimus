const discord = require('discord.js')

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

module.exports = {
  name: '8ball',
  description: 'Ask the magic 8ball a question... if you dare',
  cooldown: 30,
  execute(message, args) {
    // Pick one of the 20 8ball images at random and send it as a reply
    const result = getRandomInt(1, 20)
    const img = new discord.Attachment('./img/8ball/' + result + '.png')
    message.channel.send(img)
  }
}

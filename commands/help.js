const fs = require('fs')
const errorMessage = 'No help text is defined for this server!'

module.exports = {
  name: 'help',
  description: 'Sends a help message',
  aliases: ['helpme', 'bottimushelp'],
  execute(message, args, client) {
    const server = message.channel.guild.id
    fs.readFile(`data/help/${server}.txt`, 'utf8', (err, data) => {
      if (err) {
        message.author.send(errorMessage).catch(_ => message.channel.send(errorMessage))
      } else {
        message.author.send(data).catch(_ => message.channel.send(data))
      }
    })
  }
}

const discord = require('discord.js')
const ffmpeg = require('ffmpeg-static')
const fs = require('fs')

module.exports = {
  name: 'playsound',
  description: 'Play a funny sound effect in a voice channel',
  guilds: ['309951255575265280'],
  aliases: ['sound', 'soundeffect'],
  cooldown: 60,
  execute(message, args, client) {
    // Restrict this command to administrators
    // this would be bad for everyone to use
    if (!client.isAdministrator(user)) {
      return
    }

    const effect = `./img/sound/${args[0]}.mp3`
    if (!fs.existsSync(effect)) {
      message.channel.send('Sound not found')
      return
    }

    // Connect to a voice channel and play the sound
    if (message.member.voiceChannel) {
      message.member.voiceChannel.join().then(connection => {
        const sound = connection.playFile(effect, { volume: 0.25 })
        sound.on('end', () => connection.disconnect())
      })
    } else {
      message.channel.send('You need to be in a voice channel!')
    }
  }
}
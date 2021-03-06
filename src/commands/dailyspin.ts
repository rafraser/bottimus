import { User, MessageAttachment } from 'discord.js'
import { Client, Message } from '../command'
import { timeToString } from '../utils'
import { incrementArcadeCredits } from '../arcade'
import { queryHelper } from '../database'

const SPIN_TIME = 12 * 3600 * 1000
const GAME_WHEELS = [
  // These wheels have an average payout of 200
  ['#coin 100', '#coin 200', '#coin 400', '#coin 200', '#coin 400', '#coin 100'],
  ['#coin 100', '#coin 100', '#coin 100', '#coin 100', '#coin 100', '#coin 100', '#coin 100', '#coin 100', '#coin 1000'],
  ['#coin 100', '#coin 200', '#coin 300'],
  ['#coin 100', '#coin 300', '#coin 100', '#coin 300', '#coin 100', '#coin 300', '#coin 100', '#coin 300'],
  ['#coin 100', '#coin 300', '#coin 100', '#coin 300', '#coin 100', '#coin 300', '#coin 100', '#coin 300'],
  ['#coin 25', '#coin 50', '#coin 300', '#coin 425', '#coin 425', '#coin 300', '#coin 50', '#coin 25'],
  // These wheels have an average payout of 300
  ['#coin 125', '#coin 125', '#coin 1000', '#coin 125', '#coin 125'],
  ['#coin 42', '#coin 42', '#coin 42', '#coin 42', '#coin 42', '#coin 1590'],
  ['#coin 100', '#coin 200', '#coin 300', '#coin 400', '#coin 500'],
  ['#coin 125', '#coin 125', '#coin 1000', '#coin 125', '#coin 125'],
  // These wheels have an average payout of 400
  ['#coin 600', '#coin 200'],
  ['#coin 325', '#coin 350', '#coin 400', '#coin 450', '#coin 475']
]

function getLastSpin (id: string): Promise<any[]> {
  return queryHelper('SELECT lastspin FROM arcade_dailyspin WHERE discordid = ?;', [id])
}

function updateLastSpin (id: string, date: Date): Promise<any[]> {
  return queryHelper('INSERT INTO arcade_dailyspin VALUES(?, ?, 1) ON DUPLICATE KEY UPDATE lastspin = VALUES(lastspin), number = number + VALUES(number)', [id, date])
}

async function updateUserData (user: User): Promise<any[]> {
  return queryHelper('INSERT INTO bottimus_userdata VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE username = VALUES(username), tag = VALUES(tag), avatar = VALUES(avatar)', [user.id, user.username, user.tag, user.displayAvatarURL()])
}

function pickWheel () {
  return GAME_WHEELS[Math.floor(Math.random() * GAME_WHEELS.length)]
}

export default {
  name: 'dailyspin',
  description: 'Spin the lucky prize wheel every 12 hours!\nThis is a great way to start earning coins',
  aliases: ['daily'],
  cooldown: 300,

  async execute (client: Client, message: Message, args: string[]) {
    const lastspin = (await getLastSpin(message.member.id) as any)[0]

    // Check that users aren't spinning t oo frequently
    if (lastspin) {
      const elapsed = Math.abs(Date.now() - lastspin.lastspin.getTime())
      if (elapsed < SPIN_TIME) {
        message.channel.send(`Your next daily spin is in ${timeToString(SPIN_TIME - elapsed)}`)
        return
      }
    }

    message.channel.send('Get ready!')
    client.updateCooldown(this, message.member.id)

    // Generate and send the wheel
    const data = await client.executePython('spinner', ['--prizes'].concat(pickWheel()))
    const attachment = new MessageAttachment('./img/spinner.gif')
    await message.channel.send(attachment)

    // Announce the result after a short delay
    setTimeout(async () => {
      if (data.startsWith('ZERO')) {
        message.channel.send('Oh no :( Better luck next time!')
      } else {
        const amount = parseInt(data.replace('#coin ', ''), 10)
        const coin = client.getCoinEmoji()
        message.channel.send(`Congrats, ${message.member.displayName}! You won ${coin} **${amount}**`)

        // Update the database info once the spin is *successfully* complete
        updateLastSpin(message.member.id, new Date())
        updateUserData(message.member.user)
        await incrementArcadeCredits(message.member.id, amount)
      }
    }, 7000)
  }
}

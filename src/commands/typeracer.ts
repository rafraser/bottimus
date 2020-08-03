import { Client, Message } from "../command"
import { shuffle } from "../utils"
import { incrementArcadeCredits } from "../arcade"
import { Guild, MessageAttachment } from "discord.js"
import { easyWords, hardWords } from "../words/typeracer"

const WORDS_TOTAL = 30
const WORDS_HARD = 5

async function incrementStatScore(client: Client, userid: string, speed: number): Promise<[boolean] | [boolean, string, number]> {
    const queryOne = 'INSERT INTO arcade_typeracer (discordid, completed, speed_average) VALUES(?, 1, ?) ON DUPLICATE KEY UPDATE speed_average = ((speed_average * completed) + VALUES(speed_average))/(completed + 1), completed = completed + 1;'
    const queryTwo = 'SELECT speed_best FROM arcade_typeracer WHERE discordid = ?;'
    const queryThree = 'UPDATE arcade_typeracer SET speed_best = ?, date_best = ? WHERE discordid = ?;'

    return new Promise(async (resolve, reject) => {
        await client.queryHelper(queryOne, [userid, speed])
        let speed_results = await client.queryHelper(queryTwo, [userid])
        const best = speed_results[0].speed_best
        if (speed > best) {
            await client.queryHelper(queryThree, [speed, new Date(), userid])
            resolve([true, userid, speed])
        } else {
            resolve([false])
        }
    })
}

function isPlayingTyperacer(client: Client, guild: Guild) {
    // Create the structure if it doesn't exist
    if (!client.typeracerSessions) {
        client.typeracerSessions = new Map()
    }

    return client.typeracerSessions.has(guild.id)
}

function setPlayingTyperacer(client: Client, guild: Guild, active: boolean) {
    // Create the structure if it doesn't exist
    if (!client.typeracerSessions) {
        client.typeracerSessions = new Map()
    }

    // Update the collection
    if (active) {
        client.typeracerSessions.set(guild.id, true)
    } else {
        client.typeracerSessions.delete(guild.id)
    }
}

async function startTypeRacer(client: Client, message: Message, display: Message) {
    display.delete()
    const list = shuffle(easyWords).slice(0, WORDS_TOTAL - WORDS_HARD).concat(shuffle(hardWords).slice(0, WORDS_HARD))

    await client.executePython('typeracer', [list.join(' ')])
    const attachment = new MessageAttachment('./img/typeracer.png')
    await message.channel.send(attachment)

    const startTime = Date.now()
    let winners = new Map()

    const collector = message.channel.createMessageCollector((m => !m.member.user.bot), { time: 60000 })
    collector.on('collect', m => {
        // Check the message and see if it's a valid race response
        // Skip message if already won
        if (winners.get(m.member.id)) return

        const endtime = Date.now()
        const attempt = m.content.split(' ')
        if (attempt.length < WORDS_TOTAL) return

        // Check each word submitted by the user
        // They are allowed 2 mistakes out of 50 words (96% accuracy)
        let wrong = 0
        for (let i = 0; i < WORDS_TOTAL; i++) {
            if (attempt[i].toLowerCase() === list[i].toLowerCase()) continue

            // Wrong word, oh no!
            wrong++
            if (wrong > 1) return
        }

        // Everything is fine!
        winners.set(m.member.id, endtime)

        // React to the message
        m.delete()
        m.channel.send('✅ ' + m.member.displayName + ' has completed the race!')
    })

    collector.on('end', async () => {
        let letters = list.join(' ').length
        let place = 1
        let string = 'The race is over!\n'
        // Announce the winners
        for (const result of winners) {
            const member = message.guild.members.cache.get(result[0])
            const finishtime = result[1]
            const duration = (finishtime - startTime) / 1000
            const wpm = Math.floor((letters / 5) * (60 / duration))

            // Award credits based on WPM
            let credits = 20 + Math.ceil(wpm / 2)
            if (credits <= 25) {
                credits = 25
            } else if (credits >= 75) {
                credits = 75
            }
            incrementArcadeCredits(result[0], credits)

            // Store data, announcing records when applicable
            let record = await incrementStatScore(client, result[0], wpm)
            if (record[0]) {
                const id = record[1]
                const speed = record[2]
                const member = message.guild.members.cache.get(id).displayName
                message.channel.send('⭐ ' + member + ' set a new record of ' + speed + ' WPM!')
            }

            string += '#' + place + ') ' + member.displayName + ': ' + wpm + 'WPM\n'
            place++
        }

        message.channel.send(string)
        setPlayingTyperacer(client, message.guild, false)
    })
}

export default {
    name: 'typeracer',
    description: 'Play a game of Type Racer\nAfter the word image is sent, type out the contents as quickly as possible\nYou are allowed one mistake',
    aliases: ['typerace'],

    async execute(client: Client, message: Message, args: string[]) {
        // Make sure each guild only has a single game going on
        if (isPlayingTyperacer(client, message.guild)) return
        setPlayingTyperacer(client, message.guild, true)

        message.channel.send('Get ready for Type Racer!').then(m => {
            // Small delay before starting to allow players time to prepare
            setTimeout(() => { m.edit('Type Racer starting in: 5') }, 5000)
            setTimeout(() => { m.edit('Type Racer starting in: 4') }, 6000)
            setTimeout(() => { m.edit('Type Racer starting in: 3') }, 7000)
            setTimeout(() => { m.edit('Type Racer starting in: 2') }, 8000)
            setTimeout(() => { m.edit('Type Racer starting in: 1') }, 9000)
            setTimeout(() => { startTypeRacer(client, message, m) }, 10000)
        })
    }
}
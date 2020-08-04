import { Client, Message } from "../command"
import { User, MessageReaction, GuildMember, MessageAttachment, MessageEmbed } from "discord.js"
import { getArcadeCredits, incrementArcadeCredits } from "../arcade"
import { queryHelper } from "../database"

function updateScratch(id: string, amount: number) {
    const queryString = 'INSERT INTO arcade_scratchcard VALUES(?, 1, ?) ON DUPLICATE KEY UPDATE winnings = winnings + VALUES(winnings), number = number + VALUES(number)'
    return queryHelper(queryString, [id, amount])
}

type ScratchPrize = [string, number, number]

const prizes = [
    ['💰', 2500, 0.01],
    ['🍉', 1000, 0.03],
    ['🍒', 800, 0.05],
    ['🍋', 500, 0.18],
    ['🍓', 300, 0.22],
    ['🍇', 100, 0.34]
] as ScratchPrize[]

const icons = ['💰', '💰', '🍉', '🍉', '🍒', '🍒', '🍋', '🍋', '🍓', '🍓', '🍇', '🍇']

function weightedRandom(): ScratchPrize {
    let r = Math.random()
    for (let i = 0; i < prizes.length; i++) {
        const p = prizes[i][2] as number
        if (r < p) return prizes[i]
        r -= p
    }
    return ['', 0, 0]
}

function shuffle(a: any[]): any[] {
    let j, x, i
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1))
        x = a[i]
        a[i] = a[j]
        a[j] = x
    }

    return a
}

function getPrizeList(): [any[], number] {
    const winner = weightedRandom()
    if (winner[0] === '') {
        return [shuffle(icons).slice(0, 9), 0]
    } else {
        let ic = winner[0]
        let selection = shuffle(icons).slice(0, 6)
        let matches = 0
        let replacement = ['🍎', '🍍']
        while (selection.indexOf(ic) !== -1) {
            selection[selection.indexOf(ic)] = replacement[matches]
            matches++
        }
        selection = selection.concat([ic, ic, ic])

        return [shuffle(selection), winner[1]]
    }
}

function generateScratchCard(client: Client, msg: Message, user: GuildMember) {
    const [prizes, amount] = getPrizeList()

    // Generate the grid of squares
    let message = ''
    for (let i = 0; i < prizes.length; i++) {
        message += '||' + prizes[i] + '||'
        if ((i + 1) % 3 === 0) {
            message += '\n'
        }
    }

    msg.reactions.removeAll()
    const embed = new MessageEmbed()
        .setTitle('Scratch Card')
        .setColor('#ff9f43')
        .setDescription(message)
    msg.edit(embed)

    // Payout
    incrementArcadeCredits(user.id, amount)
    updateScratch(user.id, amount)

    // Announce winnings after 10 seconds
    setTimeout(() => {
        if (amount > 0) {
            const coin = client.emojis.cache.get('631834832300670976')
            msg.channel.send(`Congrats, ${user.displayName}! You won ${coin} **${amount}**`)
        } else {
            msg.channel.send(`Better luck next time, ${user.displayName} :(`)
        }
    }, 10000)
}

export default {
    name: 'scratchcard',
    description: 'Try your luck with a scratchcard! Each card costs **250** coins to play.\n__Payouts:__\n💰 2500\n🍉 1000\n🍒 800\n🍋 500\n🍓 300\n🍇 100',
    aliases: ['scratch'],
    cooldown: 30,

    async execute(client: Client, message: Message, args: string[]) {
        const amount = await getArcadeCredits(message.member.id)
        if (amount < 250) {
            message.channel.send('You need at lesat 250 coins for this!')
            return
        }

        const confirm_msg = await message.channel.send('Scratch cards cost 250 coins: react to confirm')
        confirm_msg.react('✅')
        const filter = (reaction: MessageReaction, user: User) => {
            return user.id === message.member.id && reaction.emoji.name === '✅'
        }

        const collector = confirm_msg.createReactionCollector(filter, { time: 25000 })
        collector.on('collect', () => {
            // Confirmation received!
            collector.stop()
            incrementArcadeCredits(message.member.id, -250)
            generateScratchCard(client, confirm_msg, message.member)
            client.updateCooldown(this, message.member.id)
        })

    }
}
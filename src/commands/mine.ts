import { Client, Message } from "../command"
import { MessageEmbed, User, MessageReaction } from "discord.js"
import { incrementArcadeCredits } from "../arcade"
import { queryHelper } from "../database"
import fetch from "node-fetch"

function incrementStatScore(userid: string, amount: number) {
    const queryString = 'INSERT INTO arcade_mining VALUES(?, 1, ?) ON DUPLICATE KEY UPDATE number = number + 1, diamonds = diamonds + VALUES(diamonds)'
    return queryHelper(queryString, [userid, amount])
}

function generateMiningEmbed(msg: Message, name: string, amount: number, over: boolean = false) {
    const embed = new MessageEmbed()
        .setTitle(name + '\'s Mining Expedition')
        .setColor('#5352ed')
    if (over) {
        embed.setDescription('This expedition is over!\n' + '💎'.repeat(amount))
    } else {
        embed.setDescription('Click the pickaxe to mine!\n' + '💎'.repeat(amount))
    }
    msg.edit(embed)
}

export default {
    name: "mine",
    description: "Mine diamonds to earn coins. Each diamond is worth 2 coins.\nClick on the pickaxe repeatedly. Due to Discord limits, it may take a moment before each diamond is mined.",
    cooldown: 200,

    async execute(client: Client, message: Message, args: string[]) {
        const msg = await message.channel.send('Get ready!')
        client.updateCooldown(this, message.member.id)

        const member = message.member
        let amount = 0
        let collecting = true
        let gameover = false
        generateMiningEmbed(msg, member.displayName, amount)

        const filter = (reaction: MessageReaction, u: User) => {
            return u.id === message.member.id && reaction.emoji.name === '⛏' && collecting
        }

        // Start watching for pickaxe clicking
        msg.react('⛏')
        const collector = msg.createReactionCollector(filter, { time: 30000 })
        collector.on('collect', async reaction => {
            collecting = false
            await reaction.users.remove(member)
            if (collecting || gameover) return

            amount++
            generateMiningEmbed(msg, member.displayName, amount)
            collecting = true
        })

        collector.on('end', _ => {
            msg.reactions.removeAll()
            gameover = true
            collecting = false

            const coin = client.emojis.cache.get('631834832300670976')
            generateMiningEmbed(msg, member.displayName, amount, true)
            msg.channel.send(`💎 ${amount} diamonds collected\n${coin} ${amount * 2} coins earned`)

            // Send results to the database
            incrementArcadeCredits(member.id, amount * 2)
            incrementStatScore(member.id, amount)
        })
    }
}
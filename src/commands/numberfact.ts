import { Client, Message } from "../command"
import { MessageEmbed } from "discord.js"
import fetch from "node-fetch"

function getNumberFactUrl(number: string) {
    // Get the url to search
    if (number) {
        if (Math.random() < 0.8) {
            return 'http://numbersapi.com/' + number + '/trivia'
        } else {
            return 'http://numbersapi.com/' + number + '/math'
        }
    } else {
        if (Math.random() < 0.8) {
            return 'http://numbersapi.com/random/trivia'
        } else {
            return 'http://numbersapi.com/random/math'
        }
    }
}

export default {
    name: 'numberfact',
    description: 'Get a random number fact\nFor a fact about a specific number: `!numberfact [number]`',
    cooldown: 10,
    guilds: ['309951255575265280'],

    async execute(client: Client, message: Message, args: string[]) {
        let url
        const number = args[0] ? args[0].replace('.', '').replace(',', '') : null

        const data = await fetch(getNumberFactUrl(number))
        const fact = await data.text()

        const embed = new MessageEmbed()
            .setColor('#9c88ff')
            .setDescription(fact)
        message.channel.send(embed)

        client.updateCooldown(this, message.member.id)
    }
}
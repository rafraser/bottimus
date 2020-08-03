import { Client, Message } from "../command"
import { MessageEmbed } from "discord.js"

function calculateTotals(results: any[]) {
    let totalGuesses = 0
    let totalCorrect = 0

    for (const result of results) {
        totalGuesses = totalGuesses + result.attempted
        totalCorrect = totalCorrect + result.correct
    }

    return [totalGuesses, totalCorrect]
}

function fetchStatistics(client: Client, id: string) {
    const queryString = 'SELECT category, attempted, correct, (correct/attempted) AS percent FROM arcade_trivia WHERE discordid = ? ORDER BY (correct/attempted) DESC;'
    return client.queryHelper(queryString, [id])
}

export default {
    name: 'triviastats',
    description: 'Fetchs statistics from Trivia\nTo view someone else\'s statistics: `!triviastats [user]`',

    async execute(client: Client, message: Message, args: string[]) {
        const user = client.findUser(message, args, true)
        const results = await fetchStatistics(client, user.id)

        const username = user.displayName
        const [totalGuesses, totalCorrect] = calculateTotals(results)

        // Generate a nice embed for details
        const embed = new MessageEmbed()
            .setColor('#4cd137')
            .setTitle(`Trivia Stats for ${username}`)
            .addField('Questions Answered', `${totalGuesses}`, true)
            .addField('Questions Correct', `${totalCorrect}`, true)
            .addField('Percentage', `${Math.floor((totalCorrect / totalGuesses) * 100) || 0}%`, true)

        // Wait until the first message is sent
        message.channel.send(embed).then(() => {
            // Generate a fancy breakdown of the trivia categories
            // This uses code formatting for extra coolness
            if (!results || results.length < 1) return

            let codestring = '```python\n\n'
            for (const result of results) {
                const qstring = (result.correct + '/' + result.attempted).padStart(8, ' ')
                const pcstring = ' (' + Math.floor(result.percent * 100) + '%)'
                const category = client.padOrTrim(result.category, 35)
                codestring += category + qstring + pcstring + '\n'
            }
            codestring += '```'
            message.channel.send(codestring)
        })
    }
}
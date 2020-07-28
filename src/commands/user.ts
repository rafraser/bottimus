import { Client, Message } from "../command"
import { MessageEmbed, Guild } from "discord.js"

function getUserRankings(guild: Guild): Promise<any> {
    return new Promise((resolve, reject) => {
        guild.members.fetch().then(m => {
            const members = Array.from(m.values())
            // Sort the list of members by joined time
            members.sort((a, b) => { return a.joinedAt.getTime() - b.joinedAt.getTime() })

            // Resolve the promise with the sorted list of members
            resolve(members)
        }).catch(reject)
    })
}

export default {
    name: 'user',
    description: 'Get user information\nThis displays the join date and join ranking for a given user',

    async execute(client: Client, message: Message, args: string[]) {
        const rankings = await getUserRankings(message.guild)
        let user
        let ranking

        // Determine the user/ranking to get data for
        if (args.length >= 1) {
            ranking = Number(args[0]) - 1

            if (!isNaN(ranking)) {
                user = rankings[ranking]
            } else {
                try {
                    // Try searching for a user in the args
                    user = client.findUser(message, args.slice())
                    ranking = rankings.indexOf(user)
                } catch (e) {
                    // If all else fails, return self
                    user = message.member
                    ranking = rankings.indexOf(user)
                }
            }
        } else {
            // Return self with no arguments
            user = message.member
            ranking = rankings.indexOf(user)
        }

        if (ranking < 0 || ranking > rankings.length) return

        // Generate the fancy embed
        const date = user.joinedAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        const embed = new MessageEmbed()
            .setTitle(user.displayName)
            .setDescription(user.user.tag)
            .setThumbnail(user.user.avatarURL())
            .setColor('4CD137')
            .addField('Ranking', '#' + (ranking + 1) + ' / ' + rankings.length, true)
            .addField('Join Date', date, true)
        message.channel.send(embed)
    }
}
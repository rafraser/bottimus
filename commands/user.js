const discord = require('discord.js')

// Return a sorted array of when users joined the server
function getUserRankings(guild) {
  return new Promise(function (resolve, reject) {
    guild.fetchMembers().then(function (g) {
      const members = Array.from(g.members.values())

      // Sort the list of members by joined time
      members.sort(function (a, b) {
        return a.joinedAt - b.joinedAt
      })

      // Resolve the promise with the sorted list of members
      resolve(members)
    }).catch(function (e) {
      // Pass errors back through the promise
      reject(e)
    })
  })
}

module.exports = {
  name: 'user',
  description: 'Get user information\nThis displays the join date and join ranking for a given user',
  execute(message, args, client) {
    getUserRankings(message.guild).then(function (rankings) {
      // First, try a direct number lookup
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
            console.log(e)
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
      const embed = new discord.RichEmbed()
        .setTitle(user.displayName)
        .setDescription(user.user.tag)
        .setThumbnail(user.user.avatarURL)
        .setColor('4CD137')
        .addField('Ranking', '#' + (ranking + 1) + ' / ' + rankings.length, true)
        .addField('Date', date, true)
      message.channel.send(embed)
    }).catch(function (e) {
      console.error(e)
    })
  }
}

const discord = require('discord.js')

const helpMessage = `
Collect coins by playing the fun Bottimus games and then exchange them for amazing prizes!

__Games__
\`\`\`
!hangman        Guess the word
!trivia         Answer a fun trivia question
!typeracer      Type the words as fast as you can
\`\`\`
__Gambling__
\`\`\`
!scratchcard    Try your luck with a scratchcard
!dailyspin      Spin for free coins every 12 hours
!prize          Exchange 1000 coins for a rare prize
!inventory      View your current prize inventory
\`\`\`
__Miscellaneous__
\`\`\`
!8ball          Ask the magic 8ball a question
!balance        Check how many tokens you have
\`\`\`
`

module.exports = {
    name: 'help',
    description: 'Sends a help message',
    aliases: ['helpme'],
    execute(message, args, client) {
        message.author.send(helpMessage)
    }
}
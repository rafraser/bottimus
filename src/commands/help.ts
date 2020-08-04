import { Client, Message, Command } from "../command"
import { MessageEmbed, TextChannel } from "discord.js"
import fs from "fs"

function defaultHelpEmbed(client: Client, message: Message) {
    const coin = client.emojis.cache.get('631834832300670976')
    const embed = new MessageEmbed()
        .setColor('#9c88ff')
        .setTitle('Commands Overview')
        .setDescription('For more help on a specific command, type `!help [command]`')
        .addField('🎮 Games', "`!hangman` `!mine` `!trivia` `!typeracer`", true)
        .addField(`${coin} Gambling`, "`!balance` `!dailyspin` `!inventory` `!prize` `!roulette` `!scratchcard`", true)
        .addField('🎲 Fun', "`!8ball` `!catfact` `!dice` `!numberfact`", true)
        .addField('ℹ️ Statistics', "`!arcadestats` `!triviascores` `!triviastats` `!user`")
    return embed
}

function commandHelpEmbed(command: Command, message: Message) {
    return new MessageEmbed()
        .setColor('#9c88ff')
        .setTitle('!' + command.name)
        .setDescription(command.description)
}

function privateMessageWithFallback(message: Message, content: string | MessageEmbed, display: boolean) {
    message.author.send(content)
        .catch(_ => message.channel.send(content))
        .then(_ => { if (display) message.channel.send('Help has been sent to your DMs!') })
}

export default {
    name: 'help',
    description: 'Sends a list of commands.\nYou can view help for a specific command with `!help [command]`',
    aliases: ['helpme', 'commands'],

    async execute(client: Client, message: Message, args: string[]) {
        const channel = message.channel as TextChannel
        if (args.length >= 1) {
            // Get help for a specific command
            const cmd = args.shift().toLowerCase()
            if (!client.commands.has(cmd)) {
                channel.send('Command not found')
                return -1
            }

            // Build and send a description embed
            const command = client.commands.get(cmd)
            const embed = commandHelpEmbed(command, message)
            channel.send(embed)
            return
        }

        // Send the basic help embed
        const basicHelp = defaultHelpEmbed(client, message)
        privateMessageWithFallback(message, basicHelp, true)

        // Check if there is any server-specific help
        const server = channel.guild.id
        fs.readFile(`data/help/${server}.txt`, 'utf8', (err, data) => {
            if (!err) privateMessageWithFallback(message, data, false)
        })
    }
}
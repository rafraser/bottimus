import { Client, ClientOptions, Message, DMChannel, TextChannel } from "discord.js"
import { promisify } from "util"
import { Command } from "./command"
import fs from "fs"
import path from "path"

const readdirAsync = promisify(fs.readdir)

export default class BottimusClient extends Client {
    public static prefixes = ['!', 'Bottimus, ']

    public readonly testingMode: boolean
    public restarting: boolean = false

    public commands: Map<string, Command>

    public constructor(testing: boolean, options: ClientOptions) {
        super(options)
        this.testingMode = testing
    }

    public async loadCommands() {
        this.commands = new Map<string, Command>()

        let files = await readdirAsync(path.resolve(__dirname, "commands"))
        files.forEach(file => {
            let p = path.parse(file)
            if (p.ext === ".js") this.loadCommand(p.name)
        })
    }

    public async loadCommand(path: string) {
        console.log('loading', path)
        let module = await import("./commands/" + path + ".js")
        let command = module.default as Command

        this.commands.set(command.name, command)
        if (command.aliases) {
            command.aliases.forEach(alias => this.commands.set(alias, command))
        }
    }

    public commandParser(message: Message) {
        // Do not handle messages by bots
        if (message.author.bot) return

        // Do not handle messages if the bot is about to restart
        if (this.restarting) return

        // Do not handle messages in DM
        if (message instanceof DMChannel) return
        const channel = message.channel as TextChannel

        // Apply scanners to every message
        // TODO

        // Check if the command is valid
        let isBottimusCommand = false
        let args
        for (const prefix of BottimusClient.prefixes) {
            if (message.content.startsWith(prefix)) {
                isBottimusCommand = true
                args = message.content.slice(prefix.length)
                break
            }
        }
        if (!isBottimusCommand) return

        // Handle args
        args = args.match(/[^"“” \n]+|["“][^"”]+["”]/g).map(arg => arg.replace(/^["“]|["”]$/g, ''))

        // Check the command name
        const cmd = args.shift().toLowerCase()
        if (!this.commands.has(cmd)) return
        const command = this.commands.get(cmd)

        // Check guild restrictions
        const guild = channel.guild.id
        if (command.guilds) {
            if (!command.guilds.includes(guild)) return
        }

        // Cooldowns
        // TBD

        // Execute the command!
        // This includes some terrible error handling!
        try {
            console.log(cmd, command)
            command.execute(this, message, args)
        } catch (err) {
            message.channel.send(err.message)
        }
    }
}
import { Client, ClientOptions, Message, DMChannel, TextChannel, GuildMember } from "discord.js"
import { promisify } from "util"
import { Command } from "./command"
import { Updater } from "./updater"
import { timeToString } from "./time"
import fs from "fs"
import path from "path"

const readdirAsync = promisify(fs.readdir)
const existsAsync = promisify(fs.exists)
const writeFileAsync = promisify(fs.writeFile)

export default class BottimusClient extends Client {
    public static prefixes = ['!', 'Bottimus, ']

    public readonly testingMode: boolean
    public restarting: boolean = false

    public commands: Map<string, Command>
    public updaters: Updater[]

    public cooldowns: Map<string, Map<string, number>> = new Map()
    public serverSettings: Map<string, any>

    private updateInterval: NodeJS.Timeout

    private static primaryGuild: string = '309951255575265280'
    private static testingChannel: string = '583635933585342466'
    private static testingChannel2: string = '723314836435501187'

    public constructor(testing: boolean, options: ClientOptions) {
        super(options)
        this.testingMode = testing

        // Load up the essentials
        this.loadCommands()
        this.loadUpdaters()

        // Register events
        this.registerEventHandlers()

        this.on('ready', () => {
            console.log(`Logged in as: ${this.user.tag}`)
            console.log(`Testing mode: ${this.testingMode}`)
        })
    }

    public async writeDataFile(directory: string, name: string, data: string) {
        // Create directory if it doesn't already exist
        if (await existsAsync('data/' + directory)) {
            fs.mkdirSync('data/' + directory)
        }

        await writeFileAsync('data/' + directory + '/' + name + '.json', JSON.stringify(data))
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

        // Restrict commands to testing channel if in testing mode
        if (this.testingMode && message.channel.id != BottimusClient.testingChannel) return
        if (!this.testingMode && message.channel.id == BottimusClient.testingChannel) return

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
        let cooldown = this.checkCooldown(command, message.member.id)
        if (cooldown !== false) {
            message.channel.send(`Slow down! Try again in ${timeToString(cooldown)}`)
            return
        }

        // Execute the command!
        // This includes some terrible error handling!
        try {
            command.execute(this, message, args)
        } catch (err) {
            message.channel.send(err.message)
        }
    }

    public checkCooldown(command: Command, user: string) {
        if (!command.cooldown) return false
        const cools = this.cooldowns.get(command.name)
        if (cools && cools.has(user)) {
            const elapsed = Date.now() - cools.get(user)

            // Send remaining time for a warning message
            if (elapsed < command.cooldown * 1000) {
                return (command.cooldown * 1000) - elapsed
            }
        } else {
            this.cooldowns.set(command.name, new Map())
            return false
        }

        return false
    }

    public updateCooldown(command: Command, user: string) {
        if (!command.cooldown) return
        if (!this.cooldowns.get(command.name)) {
            this.cooldowns.set(command.name, new Map())
        }

        this.cooldowns.get(command.name).set(user, Date.now())
    }

    public async loadUpdaters() {
        this.updaters = []

        let files = await readdirAsync(path.resolve(__dirname, "updaters"))
        files.forEach(file => {
            let p = path.parse(file)
            if (p.ext === ".js") this.loadUpdater(p.name)
        })
    }

    public async loadUpdater(path: string) {
        let module = await import("./updaters/" + path + ".js")
        let updater = module.default as Updater
        this.updaters.push(updater)
    }

    public runUpdaters() {
        const n = new Date().getMinutes()
        for (const update of this.updaters) {
            if (this.testingMode && !update.testingAllowed) continue

            if (n % update.frequency === 0) {
                update.execute(this)
            }
        }
    }

    public isAdministrator(member: GuildMember): boolean {
        if (member.hasPermission('ADMINISTRATOR')) return true

        // Get the role information from the server
        // const roleData = this.serverRoles.get(member.guild.id)
        const roleData = {} as any

        if (!roleData) return false
        if (!roleData.admin) return false

        if (roleData.admin instanceof Array) {
            // Treat arrays as a list of role IDs
            return member.roles.cache.some(role => {
                return roleData.admin.includes(role.id)
            })
        } else {
            // Treat strings as a role suffix
            return member.roles.cache.some(role => {
                return role.name.endsWith(roleData.admin)
            })
        }
    }

    public isModerator(member: GuildMember): boolean {
        if (this.isAdministrator(member)) return true

        // const roleData = this.serverSettings.get(member.guild.id)
        const roleData = {} as any

        if (!roleData) return false
        if (!roleData.mod) return false

        if (roleData.mod instanceof Array) {
            // Treat arrays as a list of role IDs
            return member.roles.cache.some(role => {
                return roleData.mod.includes(role.id)
            })
        } else {
            // Treat strings as a role suffix
            return member.roles.cache.some(role => {
                return role.name.endsWith(roleData.mod)
            })
        }
    }

    public isCommunityStar(member: GuildMember): boolean {
        if (member.guild.id !== BottimusClient.primaryGuild) return false
        if (this.isModerator(member)) return true

        return member.roles.cache.some(role => {
            return role.name.endsWith('Community Star')
        })
    }

    public findUser(message: Message, args: string[], retself: boolean = false) {

    }

    public executePython(script: string, args: string[]) {

    }

    public padOrTrim(string: string, length: number) {
        const trimmed = string.length > length ? string.substring(0, length) : string
        return trimmed.padEnd(length, ' ')
    }

    private registerEventHandlers() {
        this.on('message', this.commandParser)

        this.updateInterval = setInterval(_ => { this.runUpdaters() }, 60 * 1000)
    }

    private stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval)
            this.updateInterval = undefined
        }
    }
}

import { Command } from './command'
import { Updater } from './updater'
import { ServerSettings, loadAllServerSettings, getAdminRole, getModeratorRole, getEventRole, getJunkyardChannel } from './settings'
import { timeToString, readdirAsync, writeFileAsync } from './utils'
import { Event, loadEvents } from './events'

import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { Client, ClientOptions, Message, DMChannel, TextChannel, GuildMember, SnowflakeUtil } from 'discord.js'

export default class BottimusClient extends Client {
    public static prefixes = ['!', 'Bottimus, ']

    public readonly testingMode: boolean
    public restarting: boolean = false

    public commands: Map<string, Command>
    public updaters: Updater[]
    public welcomers: Map<string, (member: GuildMember) => any>

    public cooldowns: Map<string, Map<string, number>> = new Map()
    public serverSettings: Map<string, ServerSettings> = new Map()

    public messageCounts: Map<string, Map<string, number>> = new Map()

    public eventsData: Event[] = []
    public guildsWithEvents: string[] = []

    // Command-specific data
    public typeracerSessions: Map<string, boolean> = new Map()
    public hangmanSessions: Map<string, boolean> = new Map()

    // eslint-disable-next-line no-undef
    private updateInterval: NodeJS.Timeout

    // Python path (from .env)
    private pythonPath: string

    private static primaryGuild: string = '786168512795901962'
    private static testingChannel: string = '583635933585342466'
    private static testingChannel2: string = '723314836435501187'

    public constructor (testing: boolean, pythonPath: string, options: ClientOptions) {
      super(options)
      this.testingMode = testing
      this.pythonPath = pythonPath

      // Load up the essentials
      this.loadCommands()
      this.loadUpdaters()
      this.loadWelcomes()
      this.loadServerSettings()

      // Register events
      this.registerEventHandlers()

      // Log to console on startup
      this.on('ready', () => {
        this.setupLogging()
        console.log(`Logged in as: ${this.user.tag}`)
        console.log(`Testing mode: ${this.testingMode}`)
        loadEvents(this)
      })
    }

    public async setupLogging () {
      if (this.testingMode) return
      fs.mkdir('logs', { recursive: true }, (e) => console.error(e))
      const snowflake = SnowflakeUtil.generate()
      const logFile = fs.createWriteStream(`logs/${snowflake}.txt`)
      process.stdout.write = process.stderr.write = logFile.write.bind(logFile)
    }

    public async writeDataFile (directory: string, name: string, data: string) {
      // Create directory if it doesn't already exist
      try {
        await fs.promises.access('data/' + directory)
      } catch (error) {
        fs.mkdirSync('data/' + directory)
      } finally {
        await writeFileAsync('data/' + directory + '/' + name + '.json', JSON.stringify(data))
      }
    }

    public async loadCommands () {
      this.commands = new Map<string, Command>()

      const files = await readdirAsync(path.resolve(__dirname, 'commands'))
      files.forEach(file => {
        const p = path.parse(file)
        if (p.ext === '.js') this.loadCommand(p.name)
      })
    }

    public async loadCommand (path: string) {
      const module = await import('./commands/' + path + '.js')
      const command = module.default as Command

      this.commands.set(command.name, command)
      if (command.aliases) {
        command.aliases.forEach(alias => this.commands.set(alias, command))
      }
    }

    public commandParser (message: Message) {
      // Do not handle messages by bots
      if (message.author.bot) return

      // Count messages in Fluffy Servers
      if (!this.testingMode && message.guild.id === BottimusClient.primaryGuild) {
        this.countMessage(message.member)
      }

      // Do not handle messages if the bot is about to restart
      if (this.restarting) return

      // Restrict commands to testing channel if in testing mode
      if (this.testingMode && message.channel.id !== BottimusClient.testingChannel) return
      if (!this.testingMode && message.channel.id === BottimusClient.testingChannel) return

      // Do not handle messages in DM
      if (message instanceof DMChannel) return
      const channel = message.channel as TextChannel

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
      const cooldown = this.checkCooldown(command, message.member.id)
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

    public countMessage (member: GuildMember) {
      const guild = member.guild.id
      let guildCounts = this.messageCounts.get(guild)
      if (!guildCounts) {
        guildCounts = new Map()
        this.messageCounts.set(guild, guildCounts)
      }

      const amount = guildCounts.get(member.id) || 0
      guildCounts.set(member.id, amount + 1)
    }

    public checkCooldown (command: Command, user: string) {
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

    public updateCooldown (command: Command, user: string) {
      if (!command.cooldown) return
      if (!this.cooldowns.get(command.name)) {
        this.cooldowns.set(command.name, new Map())
      }

      this.cooldowns.get(command.name).set(user, Date.now())
    }

    public async loadUpdaters () {
      this.updaters = []

      const files = await readdirAsync(path.resolve(__dirname, 'updaters'))
      files.forEach(file => {
        const p = path.parse(file)
        if (p.ext === '.js') this.loadUpdater(p.name)
      })
    }

    public async loadUpdater (path: string) {
      const module = await import('./updaters/' + path + '.js')
      const updater = module.default as Updater
      this.updaters.push(updater)
    }

    public async runUpdaters () {
      const d = new Date()
      const n = d.getMinutes() + (d.getHours() * 60)
      for (const update of this.updaters) {
        if (n % update.frequency === 0) {
          await update.execute(this)
        }
      }
    }

    public async loadWelcomes () {
      this.welcomers = new Map()
      const files = await readdirAsync(path.resolve(__dirname, 'welcome'))
      files.forEach(file => {
        const p = path.parse(file)
        if (p.ext === '.js') this.loadWelcome(p.name)
      })
    }

    public async loadWelcome (path: string) {
      const module = await import('./welcome/' + path + '.js')
      const welcome = module.default as (member: GuildMember) => any
      this.welcomers.set(path, welcome)
    }

    public async welcomeGreeter (member: GuildMember) {
      if (this.testingMode) return
      const welcome = this.welcomers.get(member.guild.id)
      if (welcome) {
        welcome(member)
      }
    }

    public async messageDeletion (message: Message) {
      if (this.testingMode) return
      if (message.member.user.bot) return

      const mchannel = message.channel as TextChannel
      if (mchannel.name === 'bottimus') return
      if (mchannel.name === 'administration') return
      if (mchannel.name === 'bottimus-test-track') return
      if (message.content.startsWith('!say')) return

      // Get the junkyard channel for this server
      const channelId = getJunkyardChannel(this.serverSettings, message.guild.id)
      if (!channelId) return
      const channel = message.guild.channels.cache.get(channelId) as TextChannel

      // Send with attachment if applicable
      const attachment = message.attachments.first()
      if (attachment) {
        channel.send(`Deleted message by **${message.member.displayName}** in **#${mchannel.name}**:\n${message.cleanContent}`, { files: [attachment.proxyURL] })
      } else {
        channel.send(`Deleted message by **${message.member.displayName}** in **#${mchannel.name}**:\n${message.cleanContent}`)
      }
    }

    public async loadServerSettings () {
      const servers = await loadAllServerSettings()
      this.serverSettings = servers.reduce((curr, value) => {
        if (value[1].channels && value[1].channels.event) {
          this.guildsWithEvents.push(value[0])
        }
        return curr.set(value[0], value[1])
      }, new Map())
    }

    public isAdministrator (member: GuildMember): boolean {
      if (member.hasPermission('ADMINISTRATOR')) return true

      const adminRole = getAdminRole(this.serverSettings, member.guild.id)
      if (!adminRole) return false

      if (adminRole instanceof Array) {
        // Treat arrays as a list of role IDs
        return member.roles.cache.some(role => {
          return adminRole.includes(role.id)
        })
      } else {
        // Treat strings as a role suffix
        return member.roles.cache.some(role => {
          return role.name.endsWith(adminRole)
        })
      }
    }

    public isModerator (member: GuildMember): boolean {
      if (this.isAdministrator(member)) return true

      const modRole = getModeratorRole(this.serverSettings, member.guild.id)
      if (!modRole) return false

      if (modRole instanceof Array) {
        // Treat arrays as a list of role IDs
        return member.roles.cache.some(role => {
          return modRole.includes(role.id)
        })
      } else {
        // Treat strings as a role suffix
        return member.roles.cache.some(role => {
          return role.name.endsWith(modRole)
        })
      }
    }

    public isEventRole (member: GuildMember): boolean {
      if (this.isAdministrator(member)) return true
      if (this.isModerator(member)) return true

      const eventRole = getEventRole(this.serverSettings, member.guild.id)
      if (!eventRole) return false
      if (eventRole === 'everyone' || eventRole === 'none') return true

      if (eventRole instanceof Array) {
        return member.roles.cache.some(role => {
          return eventRole.includes(role.id)
        })
      } else {
        // Treat strings as a role suffix
        return member.roles.cache.some(role => {
          return role.name.endsWith(eventRole)
        })
      }
    }

    public async findUser (message: Message, args: string[], retself: boolean = false): Promise<GuildMember> {
      // Return mentioned user if any were in the message
      if (message.mentions.members.size >= 1) {
        return message.mentions.members.first()
      }

      // Handle case with 0 arguments
      if (!args || args.length < 1) {
        if (retself) {
          return message.member
        } else {
          throw new Error('No user found!')
        }
      }

      // Fetch the guild members if it's not cached for some reason
      if (message.guild.members.cache.size <= 2) {
        await message.guild.members.fetch()
      }

      // Search the list of users for matching names
      const search = args.shift().toLowerCase()
      const results = message.guild.members.cache.filter(u => {
        return u.displayName.toLowerCase().includes(search) ||
                u.user.username.toLowerCase().includes(search) ||
                u.user.tag.toLowerCase() === search
      })

      // Return results or raise an error
      // In the event no user was found, shove the argument back on the list
      if (results.size > 1) {
        throw new Error('More than one user matched!')
      } else if (results.size < 1) {
        if (retself) {
          args.unshift(search)
          return message.member
        } else {
          args.unshift(search)
          throw new Error('No user found!')
        }
      } else {
        return results.first()
      }
    }

    public executePython (script: string, args: string[]): Promise<string> {
      return new Promise((resolve, reject) => {
        let python
        if (args) {
          if (!Array.isArray(args)) {
            args = [args]
          }
          args.unshift('python/' + script + '.py')
          console.log(this.pythonPath)
          python = spawn(this.pythonPath, args)
        } else {
          python = spawn(this.pythonPath, ['python/' + script + '.py'])
        }

        let data = ''
        python.stdout.on('data', d => { data += d })
        python.stderr.on('data', d => { data += d })

        python.on('close', code => {
          data = data.trim()
          if (code === 0) {
            resolve(data)
          } else {
            reject(data)
          }
        })
      })
    }

    private registerEventHandlers () {
      this.on('message', this.commandParser)
      this.on('guildMemberAdd', this.welcomeGreeter)
      this.on('messageDelete', this.messageDeletion)

      this.updateInterval = setInterval(_ => { this.runUpdaters() }, 60 * 1000)
    }

    private stopUpdates () {
      if (this.updateInterval) {
        clearInterval(this.updateInterval)
        this.updateInterval = undefined
      }
    }
}

import Client from './client'
import { Message } from 'discord.js'
import path from 'path'
import { readdirAsync } from './utils'

export interface Command {
    name: string
    description: string
    aliases?: string[]
    cooldown?: number
    guilds?: string[]

    execute: (client: Client, message: Message, args: string[]) => void
}

export async function loadCommands (): Promise<Map<string, Command>> {
  const commands = new Map<string, Command>()

  const files = await readdirAsync(path.resolve(__dirname, 'commands'))
  files.forEach(async file => {
    const p = path.parse(file)
    if (p.ext === '.js') {
      const command = await loadCommand(p.name)
      commands.set(command.name, command)
      if (command.aliases) command.aliases.forEach(alias => commands.set(alias, command))
    }
  })

  return commands
}

export async function loadCommand (path: string): Promise<Command> {
  const module = await import('./commands/' + path + '.js')
  return module.default as Command
}

// Export these along so we can do a neat import in command implementations
// import { Client, Message, Command } from "../command"
export { Message } from 'discord.js'
export { default as Client } from './client'

import Client from './client'
import { Message } from 'discord.js'

export interface Command {
    name: string
    description: string
    aliases?: string[]
    cooldown?: number
    guilds?: string[]

    execute: (client: Client, message: Message, args: string[]) => void
}

// Export these along so we can do a neat import in command implementations
// import { Client, Message, Command } from "../command"
export { Message } from 'discord.js'
export { default as Client } from './client'

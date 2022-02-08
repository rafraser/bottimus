import { GuildMember } from 'discord.js'
import path from 'path'
import fs from 'fs'
import { readdirAsync } from './utils'

export type Welcome = (member: GuildMember) => any

export async function loadWelcomes () {
  const welcomers = new Map()
  const welcomerDirectory = path.resolve(__dirname, 'welcome')
  if (!fs.existsSync(welcomerDirectory)) {
    return
  }

  const files = await readdirAsync(welcomerDirectory)
  files.forEach(async file => {
    const p = path.parse(file)
    if (p.ext === '.js') {
      const welcome = await loadWelcome(p.name)
      welcomers.set(path, welcome)
    }
  })

  return welcomers
}

export async function loadWelcome (path: string): Promise<Welcome> {
  const module = await import('./welcome/' + path + '.js')
  return module.default as Welcome
}

import Client from './client'
import path from 'path'
import { readdirAsync } from './utils'

export interface Updater {
    description: string
    frequency: number
    testingAllowed?: boolean

    execute: (client: Client) => Promise<any>
}

export async function loadUpdaters (): Promise<Updater[]> {
  const updaters = [] as Updater[]

  const files = await readdirAsync(path.resolve(__dirname, 'updaters'))
  files.forEach(async file => {
    const p = path.parse(file)
    if (p.ext === '.js') {
      const updater = await loadUpdater(p.name)
      updaters.push(updater)
    }
  })

  return updaters
}

export async function loadUpdater (path: string): Promise<Updater> {
  const module = await import('./updaters/' + path + '.js')
  return module.default as Updater
}

// Export these along so we can do a neat import in updater implementations
// import { Client, Updater } from "../updater"
export { default as Client } from './client'

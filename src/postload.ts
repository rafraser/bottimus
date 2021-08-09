import Client from './client'
import path from 'path'
import { readdirAsync } from './utils'

export type PostloadScript = (client: Client) => any

export async function loadPostloadScripts (client: Client): Promise<void> {
  const files = await readdirAsync(path.resolve(__dirname, 'postload'))
  files.forEach(async file => {
    const p = path.parse(file)
    if (p.ext === '.js') {
      await loadPostloadScript(p.name, client)
    }
  })
}

export async function loadPostloadScript (path: string, client: Client): Promise<void> {
  const module = await import('./postload/' + path + '.js')
  const action = module.default as PostloadScript
  action(client)
}

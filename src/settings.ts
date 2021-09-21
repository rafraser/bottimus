import { readdirAsync, readFileAsync } from './utils'

export type RoleGroup = {
  name?: string,
  category?: string,
  min?: number,
  max?: number
  options: { [name: string]: string }
  reactionMessage?: { channel: string, message: string },
  reactionEmotes?: { [name: string]: string }
}

export type ServerRoles = {
    mod?: string | string[],
    admin?: string | string[],
    event?: string | string[],
    muted?: string,
    ticket?: string,
    choices: RoleGroup[]
}

export type ServerChannels = {
  event?: string,
  admin?: string,
  junkyard?: string
}

export type ServerSettings = {
  roles?: ServerRoles
  channels?: ServerChannels
  timezone?: string | string[]
}
export type ServerSettingsList = Map<string, ServerSettings>

export function getServerSettings (settings: Map<string, ServerSettings>, id: string) {
  return settings.get(id)
}

export function getModeratorRole (settings: Map<string, ServerSettings>, id: string) {
  const server = settings.get(id)
  if (!server || !server.roles) return
  return server.roles.mod
}

export function getAdminRole (settings: Map<string, ServerSettings>, id: string) {
  const server = settings.get(id)
  if (!server || !server.roles) return
  return server.roles.admin
}

export function getEventRole (settings: Map<string, ServerSettings>, id: string) {
  const server = settings.get(id)
  if (!server || !server.roles) return
  return server.roles.event
}

export function getMutedRole (settings: Map<string, ServerSettings>, id: string) {
  const server = settings.get(id)
  if (!server || !server.roles) return
  return server.roles.muted
}

export function getTicketRole (settings: Map<string, ServerSettings>, id: string) {
  const server = settings.get(id)
  if (!server || !server.roles) return
  return server.roles.ticket
}

export function getChooseableRoles (settings: Map<string, ServerSettings>, id: string) {
  const server = settings.get(id)
  if (!server || !server.roles) return
  return server.roles.choices
}

export function getEventChannel (settings: Map<string, ServerSettings>, id: string) {
  const server = settings.get(id)
  if (!server || !server.channels) return
  return server.channels.event
}

export function areEventsEnabled (settings: Map<string, ServerSettings>, id: string) {
  const server = settings.get(id)
  if (!server || !server.channels) return false
  if (!server.channels.event) return false
  return true
}

export function getAdminChannel (settings: Map<string, ServerSettings>, id: string) {
  const server = settings.get(id)
  if (!server || !server.channels) return
  return server.channels.admin
}

export function getTimezones (settings: Map<string, ServerSettings>, id: string) : string[] {
  const server = settings.get(id)
  if (!server || !server.timezone) return
  if (Array.isArray(server.timezone)) {
    return server.timezone
  } else {
    return [server.timezone]
  }
}

export function getTimezone (settings: Map<string, ServerSettings>, id: string) : string {
  const server = settings.get(id)
  if (!server || !server.timezone) return
  if (Array.isArray(server.timezone)) {
    return server.timezone[0]
  } else {
    return server.timezone
  }
}

export async function loadServerSettings (id: string): Promise<[string, ServerSettings]> {
  const data = await readFileAsync('data/settings/' + id + '.json', 'utf8')
  return [id, JSON.parse(data) as ServerSettings]
}

export async function loadAllServerSettings () {
  const files = await readdirAsync('data/settings')
  const guilds = files.map(f => f.replace('.json', ''))
  return Promise.all(guilds.map(g => loadServerSettings(g)))
}

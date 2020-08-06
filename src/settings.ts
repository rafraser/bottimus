import { Server } from "ws"
import { readdirAsync, readFileAsync } from "./utils"

export type ServerRoles = {
    mod?: string | string[],
    admin?: string | string[],
    event?: string | string[],
    muted?: string,
    ticket?: string,
    choices: RoleGroup[]
}

export type RoleGroup = {
    name?: string,
    category?: string,
    min?: number,
    max?: number
    options: { [name: string]: string }
}

export function getServerSettings(settings: Map<string, ServerSettings>, id: string) {
    return settings.get(id)
}

export function getModeratorRole(settings: Map<string, ServerSettings>, id: string) {
    let server = settings.get(id)
    if (!server) return
    return server.roles.mod
}

export function getAdminRole(settings: Map<string, ServerSettings>, id: string) {
    let server = settings.get(id)
    if (!server) return
    return server.roles.admin
}

export function getEventRole(settings: Map<string, ServerSettings>, id: string) {
    let server = settings.get(id)
    if (!server) return
    return server.roles.event
}

export function getMutedRole(settings: Map<string, ServerSettings>, id: string) {
    let server = settings.get(id)
    if (!server) return
    return server.roles.muted
}

export function getTicketRole(settings: Map<string, ServerSettings>, id: string) {
    let server = settings.get(id)
    if (!server) return
    return server.roles.ticket
}

export function getChooseableRoles(settings: Map<string, ServerSettings>, id: string) {
    let server = settings.get(id)
    if (!server) return
    return server.roles.choices
}

export type ServerChannels = {
    event?: string,
    admin?: string,
    junkyard?: string
}

export type ServerSettings = {
    roles?: ServerRoles
    channels?: ServerChannels
}
export type ServerSettingsList = Map<string, ServerSettings>

export async function loadServerSettings(id: string) {
    const data = await readFileAsync('data/settings/' + id + '.json', 'utf8')
    return [id, JSON.parse(data)]
}

export async function loadAllServerSettings() {
    const files = await readdirAsync('data/settings')
    const guilds = files.map(f => f.replace('.json', ''))
    return Promise.all(guilds.map(g => loadServerSettings(g)))
}
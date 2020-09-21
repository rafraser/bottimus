import Client from './client'

export interface Updater {
    description: string
    frequency: number
    testingAllowed?: boolean

    execute: (client: Client) => Promise<any>
}

// Export these along so we can do a neat import in updater implementations
// import { Client, Updater } from "../updater"
export { default as Client } from './client'

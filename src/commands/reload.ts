import { Client, Message } from "../command"
import { loadEvents } from "../events"

const reload_modes = {
    'settings': async (client) => client.loadServerSettings(),
    'events': async (client) => loadEvents(client),
    'commands': async (client) => client.loadCommands(),
    'updaters': async (client) => client.loadUpdaters()
} as { [key: string]: (client: Client) => Promise<any> }

export default {
    name: 'reload',
    description: '🛡️ Reloads essential data',
    guilds: ['309951255575265280'],

    async execute(client: Client, message: Message, args: string[]) {
        if (!client.isAdministrator(message.member)) {
            message.channel.send('You need to be an Administrator to use this!')
            return
        }

        if (args.length < 1) {
            const modes = Object.keys(reload_modes).join(' ')
            message.channel.send('Please select a reload mode:```all ' + modes + '```')
            return
        }

        if (args[0] == 'all') {
            for (let key in reload_modes) {
                await reload_modes[key](client)
                message.channel.send(`Reloaded ${key}`)
            }
        } else if (reload_modes[args[0]]) {
            await reload_modes[args[0]](client)
            message.channel.send(`Reloaded ${args[0]}`)
        } else {
            message.channel.send('Invalid reload mode.')
            return
        }
    }
}
import { Client, Message, loadCommands } from '../command'
import { loadEvents } from '../events'

const reloadModes = {
  settings: async (client) => client.loadServerSettings(),
  events: async (client) => loadEvents(client),
  commands: async (client) => { client.commands = await loadCommands() },
  updaters: async (client) => client.loadUpdaters()
} as { [key: string]: (client: Client) => Promise<any> }

export default {
  name: 'reload',
  description: '🛡️ Reloads essential data',
  guilds: ['786168512795901962'],

  async execute (client: Client, message: Message, args: string[]) {
    if (!client.isAdministrator(message.member)) {
      message.channel.send('You need to be an Administrator to use this!')
      return
    }

    if (args.length < 1) {
      const modes = Object.keys(reloadModes).join(' ')
      message.channel.send('Please select a reload mode:```all ' + modes + '```')
      return
    }

    if (args[0] === 'all') {
      for (const key in reloadModes) {
        await reloadModes[key](client)
        message.channel.send(`Reloaded ${key}`)
      }
    } else if (reloadModes[args[0]]) {
      await reloadModes[args[0]](client)
      message.channel.send(`Reloaded ${args[0]}`)
    } else {
      message.channel.send('Invalid reload mode.')
    }
  }
}

import { Client, Message } from "../command"

export default {
    name: 'serversettings',
    description: '🛡️ View server settings',

    async execute(client: Client, message: Message, args: string[]) {
        if (!client.isAdministrator(message.member)) {
            message.channel.send('You need to be an Administrator to use this!')
            return
        }

        let settings = client.serverSettings.get(message.guild.id)
        if (!settings) {
            message.channel.send('No server settings found')
            return
        }

        const serverSettingsString = '```' + JSON.stringify(settings, null, 4) + '```'
        message.channel.send('For server settings changes, please contact FluffyXVI#3019 \n' + serverSettingsString)
    }
}
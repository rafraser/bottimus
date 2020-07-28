import "dotenv/config"
import BottimusClient from "./client";

const client = new BottimusClient((process.env.ENV === "development"), {
    ws: {
        intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MEMBERS']
    }
})

// Typescript testing
client.on('ready', () => {
    console.log(`Logged in as: ${client.user.tag}`)
    console.log(`Testing mode: ${client.testingMode}`)
})

// Pass through everything to command handler
client.on('message', (message) => {
    client.commandParser(message)
})

// Everything is ready - let's get started
client.loadCommands()
client.login(process.env.DISCORD)
import "dotenv/config"
import BottimusClient from "./client";

const client = new BottimusClient({
    ws: {
        intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MEMBERS']
    }
}, (process.env.ENV === "development"))

// Typescript testing
client.on('ready', () => {
    console.log(`Logged in as: ${client.user.tag}`)
    console.log(`Testing mode: ${client.testingMode}`)
})

// Everything is ready - let's get started
client.login(process.env.DISCORD)
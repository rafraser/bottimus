import 'dotenv/config'
import BottimusClient from './client'

const client = new BottimusClient((process.env.ENV === 'development'), {
  ws: {
    intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MEMBERS']
  }
})

client.login(process.env.DISCORD)

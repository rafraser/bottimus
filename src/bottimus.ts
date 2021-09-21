/* eslint-disable import/first */
// Load the .env file for our environment before any imports
import dotenv from 'dotenv'

const env = process.env.BOTTIMUS_ENV || 'development'

dotenv.config({
  path: `${env}.env`
})

import BottimusClient from './client'

const client = new BottimusClient((env === 'development'), (process.env.PYTHON_PATH || 'python3'), {
  intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MEMBERS']
})

client.login(process.env.DISCORD)

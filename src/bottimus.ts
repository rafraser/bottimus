/* eslint-disable import/first */
// Load the .env file for our environment before any imports
import dotenv from 'dotenv'
dotenv.config({
  path: `${process.env.BOTTIMUS_ENV || 'development'}.env`
})

import BottimusClient from './client'

const client = new BottimusClient((process.env.BOTTIMUS_ENV === 'development'), (process.env.PYTHON_PATH || 'python3'), {
  ws: {
    intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MEMBERS']
  }
})

client.login(process.env.DISCORD)

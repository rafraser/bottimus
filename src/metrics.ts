/* eslint no-new: "off" */
import client from 'prom-client'
import http from 'http'
import bottimus from './bottimus'
import { queryHelper } from './database'

// This entire module is only enabled if METRICS_EXPORT_PORT is set in the environment
// If metrics aren't enabled, this is intended to have as little overhead as possible
let counterMessagesSeen : client.Counter<string>
let counterCommandsProcessed : client.Counter<string>

if (process.env.METRICS_EXPORT_PORT) {
  counterMessagesSeen = new client.Counter({
    name: 'bottimus_messages_total',
    help: 'Number of messages seen by Bottimus'
  })

  counterCommandsProcessed = new client.Counter({
    name: 'bottimus_commands_total',
    help: 'Number of commands processed by Bottimus',
    labelNames: ['command']
  })

  new client.Gauge({
    name: 'bottimus_cached_server_total',
    help: 'Cached number of servers Bottimus is currently in',
    collect () {
      this.set(bottimus.guilds.cache.size)
    }
  })

  new client.Gauge({
    name: 'bottimus_cached_user_total',
    help: 'Number of cached users',
    collect () {
      this.set(bottimus.users.cache.size)
    }
  })

  new client.Gauge({
    name: 'bottimus_prizes_total',
    help: 'Total number of prizes collected',
    async collect () {
      const results = await queryHelper('SELECT SUM(amount) AS total FROM arcade_prizes', [])
      if (results.length === 1) {
        this.set(results[0].total)
      }
    }
  })

  new client.Gauge({
    name: 'bottimus_coins_total',
    help: 'Total number of coins collected',
    async collect () {
      const results = await queryHelper('SELECT SUM(amount) AS total FROM arcade_currency', [])
      if (results.length === 1) {
        this.set(results[0].total)
      }
    }
  })

  // Rudimentary HTTP server - stops us needing to import express just for this
  http.createServer(async (req, res) => {
    if (req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': client.register.contentType })
      res.end(await client.register.metrics())
    } else {
      res.writeHead(404)
    }
    res.end()
  }).listen(process.env.METRICS_EXPORT_PORT)
}

export function incrementMessagesSeen () {
  if (counterMessagesSeen) { counterMessagesSeen.inc() }
}

export function incrementCommandsProcessed (commandName: string) {
  if (counterCommandsProcessed) { counterCommandsProcessed.inc({ command: commandName }) }
}

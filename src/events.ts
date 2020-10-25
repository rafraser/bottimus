/* error in EventCategory without the below line */
/* eslint-disable no-unused-vars */
import { queryHelper } from './database'
import { timeToString } from './utils'
import { Guild, GuildMember, SnowflakeUtil, MessageEmbed } from 'discord.js'
import { DateTime } from 'luxon'
import BottimusClient from './client'

export function formatEventDate (date: DateTime, newline: boolean = true) {
  // Robert A Fraser elite coding skills right here
  // This is a pretty awful way of handling daylight savings
  // I'm working on some changes to have proper timezones - stay tuned

  // October 26 08:17 PM AEST
  return date.toFormat('MMMM dd hh:mma ZZZZ')
}

export enum EventCategory {
    AmongUs = 'amongus',
    Art = 'art',
    CSGO = 'csgo',
    Death = 'death',
    Deathrun = 'deathrun',
    Dodgeball = 'dodgeball',
    Dota = 'dota',
    FallGuys = 'fallguys',
    Generic = 'generic',
    Ghost = 'ghost',
    Gmod = 'gmod',
    Golf = 'golf',
    Hidden = 'hidden',
    Jackbox = 'jackbox',
    League = 'league',
    Mapping = 'mapping',
    Minecraft = 'minecraft',
    Minigames = 'minigames',
    Movie = 'movie',
    Murder = 'murder',
    Music = 'music',
    Overwatch = 'overwatch',
    Racing = 'racing',
    RocketLeague = 'rocketleague',
    Sandbox = 'sandbox',
    Starbound = 'starbound',
    Stream = 'stream',
    Switch = 'switch',
    Terraria = 'terraria',
    Testing = 'testing',
    TF2 = 'tf2',
    Tower = 'tower',
    Voice = 'voice',
    Zombie = 'zombie'
}

export class Event {
    id: string
    guild: string

    title: string
    description: string
    category: EventCategory = EventCategory.Generic

    scheduler: string
    schedulerID: string
    approved: boolean = false

    time: Date
    time2: DateTime
    completed: boolean = false
    cancelled: boolean = false
    attendees: number = 0

    public constructor (guild: Guild, title: string, description: string, member: GuildMember, time: Date) {
      this.id = SnowflakeUtil.generate()
      this.guild = guild.id

      this.title = title
      this.description = description
      this.category = this.getCategoryFromInfo()

      this.scheduler = member.displayName
      this.schedulerID = member.id
      this.time = time
      this.time2 = DateTime.fromJSDate(this.time, { zone: 'utc' })
    }

    public getCategoryFromInfo (): EventCategory {
      const words = this.title.split(' ').concat(this.description.split(' '))
      for (let word of words) {
        word = word.toLowerCase()
        const keys = Object.keys(EventCategory).filter(x => (<any>EventCategory)[x] === word)
        if (keys.length > 0) {
          return (<any>EventCategory)[keys[0]] as EventCategory
        }
      }

      return EventCategory.Generic
    }

    public getEventIcon () {
      return `https://fluffyservers.com/img/events/${this.category}.png`
    }

    public async registerEvent () {
      await this.updateDatabase()
    }

    public async approveEvent () {
      this.approved = true
      await this.updateDatabase()
    }

    public async cancelEvent () {
      this.cancelled = true
      await this.updateDatabase()
    }

    public async completeEvent (attendees: number) {
      this.completed = true
      this.attendees = attendees
      await this.updateDatabase()
    }

    public generateEventEmbed () {
      const formattedTime = formatEventDate(this.time2)
      const image = this.getEventIcon()
      const embed = new MessageEmbed()
        .setColor('#f0932b')
        .setTitle(this.title)
        .setThumbnail(image)
        .setDescription(this.description)
        .addField('Scheduled by:', this.scheduler, true)
        .addField('Time:', formattedTime, true)
      if (this.cancelled) {
        embed.addField('CANCELLED', false)
      } else if (!this.completed) {
        const timeLeft = timeToString(this.time.getTime() - Date.now(), 2)
        embed.addField('Starting in:', timeLeft, false)
        embed.setFooter('Click the bell to be pinged when this event starts')
      }

      return embed
    }

    private async updateDatabase () {
      const queryString = `
            INSERT INTO bottimus_events
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                approved = VALUES(approved),
                time = VALUES(time),
                completed = VALUES(completed),
                cancelled = VALUES(cancelled),
                attendees = VALUES(attendees)
        `
      await queryHelper(queryString, [this.id, this.guild, this.title, this.description, this.category, this.scheduler, this.schedulerID, this.approved, this.time, this.completed, this.cancelled, this.attendees])
    }
}

export async function loadEvents (client: BottimusClient) {
  client.eventsData = []
  const queryString = 'SELECT * FROM bottimus_events WHERE time > NOW() - INTERVAL 35 DAY AND cancelled = 0'
  const results = await queryHelper(queryString, [])

  const rowToEvent = async (row: any) => {
    const guild = client.guilds.cache.get(row.guild)
    const member = await guild.members.fetch(row.schedulerID)
    const event = new Event(guild, row.title, row.description, member, row.time)
    event.id = row.id
    event.category = row.category as EventCategory
    event.approved = row.approved
    event.completed = row.completed
    event.cancelled = row.cancelled
    event.attendees = row.attendees
    return event
  }

  results.forEach(async result => {
    if (client.guilds.cache.has(result.guild)) {
      const event = await rowToEvent(result)
      client.eventsData.push(event)
    }
  })
}

export async function denyEvent (id: string) {
  const queryString = 'DELETE FROM bottimus_events WHERE id = ? AND approved = 0'
  return await queryHelper(queryString, [id])
}

export function getSortedEvents (events: Event[], guild: string | Guild) {
  const id = (typeof guild === 'string') ? guild : guild.id
  const approvedEvents = events.filter(e => e.guild === id).filter(e => e.approved)
  return approvedEvents.sort((a, b) => a.time.getTime() - b.time.getTime())
}

export function getUpcomingEvents (events: Event[], guild: string | Guild) {
  return getSortedEvents(events, guild).filter(e => !e.completed)
}

export function getNextEvent (events: Event[], guild: string | Guild) {
  return getSortedEvents(events, guild).find(e => !e.completed)
}

export function getUnapprovedEvent (events: Event[], guild: string | Guild) {
  const id = (typeof guild === 'string') ? guild : guild.id
  return events.filter(e => e.guild === id).find(e => !e.approved)
}

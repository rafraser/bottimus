import { queryHelper } from "./database"
import { Guild, GuildMember, SnowflakeUtil, MessageEmbed } from "discord.js"

export function formatEventDate(date: Date, newline: boolean = true) {
    // Robert A Fraser elite coding skills right here
    // This is a pretty awful way of handling daylight savings
    // I'm working on some changes to have proper timezones - stay tuned
    let timezone = 'AEST'
    if (timezone == 'AEST' && date.getTimezoneOffset() === -660) {
        timezone = 'AEDT'
    }

    let timeString = date.toLocaleString('en-GB', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    if (newline) {
        return timeString.replace(',', '\n') + ' ' + timezone
    } else {
        return timeString + ' ' + timezone
    }
}

export enum EventCategory {
    Art = "art",
    CSGO = "csgo",
    Death = "death",
    Deathrun = "deathrun",
    Dodgeball = "dodgeball",
    Dota = "dota",
    Generic = "generic",
    Gmod = "gmod",
    Golf = "golf",
    Hidden = "hidden",
    Jackbox = "jackbox",
    League = "league",
    Mapping = "mapping",
    Minecraft = "minecraft",
    Minigames = "minigames",
    Movie = "movie",
    Murder = "murder",
    Music = "music",
    Overwatch = "overwatch",
    Racing = "racing",
    Sandbox = "sandbox",
    Stream = "stream",
    Switch = "switch",
    Testing = "testing",
    Tower = "tower",
    Voice = "voice",
    Zombie = "zombie"
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
    completed: boolean = false
    cancelled: boolean = false
    attendees: number = 0

    public constructor(guild: Guild, title: string, description: string, member: GuildMember, time: Date) {
        this.id = SnowflakeUtil.generate()
        this.guild = guild.id

        this.title = title
        this.description = description
        this.category = this.getCategoryFromInfo()

        this.scheduler = member.displayName
        this.schedulerID = member.id
        this.time = time

        this.updateDatabase()
    }

    public getCategoryFromInfo(): EventCategory {
        const words = this.title.split(' ').concat(this.description.split(' '))
        for (let word of words) {
            word = word.toLowerCase()
            let maybeCategory: EventCategory | undefined = (<any>Event)[word]
            if (maybeCategory !== undefined) {
                return maybeCategory
            }
        }

        return EventCategory.Generic
    }

    public getEventIcon() {
        return `https://fluffyservers.com/img/events/${this.category}.gif`
    }

    public approveEvent() {
        this.approved = true
        this.updateDatabase()
    }

    public cancelEvent() {
        this.cancelled = true
        this.updateDatabase()
    }

    public completeEvent(attendees: number) {
        this.completed = true
        this.attendees = attendees
        this.updateDatabase()
    }

    public generateEventEmbed() {
        const formattedTime = formatEventDate(this.time)
        const image = this.getEventIcon()
        const embed = new MessageEmbed()
            .setColor('#f0932b')
            .setTitle(this.title)
            .setThumbnail(image)
            .setDescription(this.description)
            .addField('Scheduled by:', this.scheduler, true)
            .addField('Time:', formattedTime, true)
        if (this.completed) {
            embed.setFooter('Click the bell to be pinged when this event starts')
        } else if (this.cancelled) {
            embed.addField('CANCELLED', false)
        } else {
            let timeLeft = 'help me i am stuck in an event making factory'
            embed.addField('Starting in:', timeLeft, false)
        }

        return embed
    }

    private async updateDatabase() {
        const queryString = `
            INSERT INTO bottimus_events
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                approved = VALUES(approved),
                time = VALUES(time),
                completed = VALUES(completed),
                cancelled = VALUES(cancelled),
                attendees = VALUES(attendees),
        `
        await queryHelper(queryString, [this.id, this.guild, this.title, this.description, this.category, this.scheduler, this.schedulerID, this.approved, this.time, this.completed, this.cancelled, this.attendees])
    }
}

export async function loadEvents() {
    const queryString = 'SELECT * FROM bottimus_events WHERE time > NOW() - INTERVAL 35 DAY'
    const results = await queryHelper(queryString, [])
    return results.map(r => r as Event)
}

export function getSortedEvents(events: Event[], guild: Guild) {
    let approvedEvents = events.filter(e => e.guild === guild.id).filter(e => e.approved)
    return approvedEvents.sort((a, b) => a.time.getTime() - b.time.getTime())
}

export function getNextEvent(events: Event[], guild: Guild) {
    return getSortedEvents(events, guild).find(e => !e.completed)
}

export function getUnapprovedEvent(events: Event[], guild: Guild) {
    return events.filter(e => e.guild === guild.id).find(e => !e.approved)
}
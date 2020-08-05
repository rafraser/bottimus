import { promisify } from "util"
import fs from "fs"

/**
 * FS Promisified functions
 */
export const readdirAsync = promisify(fs.readdir)
export const existsAsync = promisify(fs.exists)
export const readFileAsync = promisify(fs.readFile)
export const writeFileAsync = promisify(fs.writeFile)

/**
 * Array Utilities
 */
export function shuffle(a: any[]): any[] {
    let j, x, i
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1))
        x = a[i]
        a[i] = a[j]
        a[j] = x
    }

    return a
}

/**
 * Time Utilities
 */
const TIME_SECOND = [1000, 'second'] as any
const TIME_MINUTE = [60 * TIME_SECOND[0], 'minute'] as any
const TIME_HOUR = [60 * TIME_MINUTE[0], 'hour'] as any
const TIME_DAY = [24 * TIME_HOUR[0], 'day'] as any

function splitTime(ms: number, unit: [number, string], timestack: string[]): number {
    const quotient = Math.floor(ms / unit[0])
    const remainder = ms % unit[0]

    let str = quotient + ' ' + unit[1]
    if (quotient > 1) {
        str += 's'
    }
    timestack.push(str)

    return remainder
}

export function timeToString(ms: number, depth: number = 1): string {
    const timestack = [] as string[]

    // Combine multiple time components until the maximum depth is reached
    while (depth > 0) {
        if (ms < TIME_SECOND[0]) {
            break
        } else if (ms < TIME_MINUTE[0]) {
            splitTime(ms, TIME_SECOND, timestack)
            break
        } else if (ms < TIME_HOUR[0]) {
            ms = splitTime(ms, TIME_MINUTE, timestack)
        } else if (ms < TIME_DAY[0]) {
            ms = splitTime(ms, TIME_HOUR, timestack)
        } else {
            ms = splitTime(ms, TIME_DAY, timestack)
        }

        depth--
    }

    // Base case for handling very small times
    if (timestack.length >= 1) {
        return timestack.join(', ')
    } else {
        return '<1 second'
    }
}
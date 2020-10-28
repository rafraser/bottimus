/*
    The crux of the issue - we want short timezone codes
    However, due to some stupid solutions by Unicode CLDR
    these short timezone codes are dependent on locale!
    eg. if in en-US then PDT, EST work as normal but AEST will display as GMT+10

    Since long timezone codes are not locale dependent (???), we have this mapping to convert
    from long codes to short codes.
    This is a pretty awful solution - let me know if you have any better ideas.

    Also I'm skipping a lot of the less significant timezones (sorry)
    if you ever need these let me know and I'll fill them in
*/
const timezoneConversion = new Map<string, string>()
timezoneConversion.set('Australian Central Daylight Time', 'ACDT')
timezoneConversion.set('Australian Central Standard Time', 'ACST')
timezoneConversion.set('Atlantic Daylight Time', 'ADT')
timezoneConversion.set('Australian Eastern Daylight Time', 'AEDT')
timezoneConversion.set('Australian Eastern Standard Time', 'AEST')
timezoneConversion.set('Australian Western Daylight Time', 'AWDT')
timezoneConversion.set('Australian Western Standard Time', 'AWST')
timezoneConversion.set('Central Daylight Time', 'CDT')
timezoneConversion.set('Central European Summer Time', 'CEST')
timezoneConversion.set('Central European Standard Time', 'CET')
timezoneConversion.set('Central Standard Time', 'CST')
timezoneConversion.set('Eastern Daylight Time', 'EDT')
timezoneConversion.set('Eastern European Summer Time', 'EEST')
timezoneConversion.set('Eastern European Time', 'EET')
timezoneConversion.set('Eastern Standard Time', 'EST')
timezoneConversion.set('Greenwich Mean Time', 'GMT')
timezoneConversion.set('Japan Standard Time', 'JST')
timezoneConversion.set('Korea Standard Time', 'KST')
timezoneConversion.set('Mountain Daylight Time', 'MDT')
timezoneConversion.set('Mountain Standard Time', 'MST')
timezoneConversion.set('New Zealand Daylight Time', 'NZDTT')
timezoneConversion.set('New Zealand Standard Time', 'NZST')
timezoneConversion.set('Pacific Daylight Time', 'PDT')
timezoneConversion.set('Pacific Standard Time', 'PST')
timezoneConversion.set('Western European Summer Time', 'WEST')
timezoneConversion.set('Western European Standard Time', 'WET')

export function convertTimezoneLongToShort (longCode: string): string {
  return timezoneConversion.get(longCode) || longCode
}

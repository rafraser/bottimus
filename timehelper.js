const TIME_SECOND = [1000, 'second']
const TIME_MINUTE = [60 * TIME_SECOND[0], 'minute']
const TIME_HOUR = [60 * TIME_MINUTE[0], 'hour']
const TIME_DAY = [24 * TIME_HOUR[0], 'day']

function splitTime (ms, unit, timestack) {
  const quotient = Math.floor(ms / unit[0])
  const remainder = ms % unit[0]

  console.log(ms, unit, quotient, remainder, unit[1])

  let str = quotient + ' ' + unit[1]
  if (quotient > 1) {
    str += 's'
  }
  timestack.push(str)

  return remainder
}

function timeToString (ms, depth = 1) {
  const timestack = []

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

module.exports.timeToString = timeToString
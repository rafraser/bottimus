import { queryHelper } from './database'

type Prize = [string, string, number]

export const prizeList = [
  ['popcorn', 'Mostly Popped Popcorn', 25],
  ['bowlingpin', 'Bowling Pin', 24],
  ['drum', 'Industrial Drum', 24],
  ['cards', 'Deck of Cards', 23],
  ['dice', 'Fuzzy Dice', 23],
  ['chocolate', 'Suspicious Chocolate', 22],
  ['soda', 'Carbonated Beverage', 21],
  ['dumbbell', 'Very Heavy Dumbbell', 21],
  ['glasses', 'Lost Glasses', 20],
  ['redrocket', 'Toy Rocket (Red)', 20],
  ['greenrocket', 'Toy Rocket (Green)', 20],

  ['tape3', 'Digital Cassette', 18],
  ['purplerocket', 'Toy Rocket (Purple)', 18],
  ['bluerocket', 'Toy Rocket (Blue)', 18],
  ['redhat', 'Lvl 100 Boss Hat', 17],
  ['glasses3d', 'Budget VR Headset', 17],
  ['plant1', 'Magic Bloom', 16],
  ['oldbarrel', 'Ancient Barrel', 16],
  ['tape2', 'Future Cassette', 15],
  ['bonsaigreen', 'Beautiful Bonsai', 15],

  ['coin', 'Frank the Cat Token', 14],
  ['pickaxe', 'Titanium Pickaxe', 14],
  ['monitor', 'Broken Monitor', 13],
  ['toxicdrum', 'Corrosive Waste Drum', 13],
  ['vinyl', 'Retro Record', 13],
  ['crystalgp', 'Crystal of The Forest', 13],
  ['oregreen', 'Uranium Ore', 13],
  ['gamebro', 'Gamebro', 12],
  ['goldhat', 'Ringmaster\'s Hat', 11],
  ['whiskey', 'Top Shelf Whiskey', 11],
  ['tape1', 'Retro Cassette', 10],
  ['plant2', 'Autumn Diamond', 10],
  ['mysteryorb', 'Mysterious Orb', 10],

  ['mars', 'Mars', 9],
  ['crystalpr', 'Amazing Amethyst', 9],
  ['bonsaipink', 'Sakura Blossom', 8],
  ['fox', 'Plush Fox', 8],
  ['pluto', 'Pluto', 8],
  ['goldmonitor', 'Royal (Broken) Monitor', 8],
  ['tape4', 'Aesthetic Cassette', 7],
  ['vinylgold', 'Golden Record', 7],
  ['crystalbg', 'Jewel of Atlantis', 7],
  ['rubberduck', 'Dr. Quackers', 6],
  ['icefox', 'Ice Fox', 6],
  ['gamebrocolor', 'Gamebro Color', 6],
  ['infinityfox', 'Infinity Fox', 5],
  ['crystalob', 'Gem of Horus', 5]
] as Prize[]

export function weightToRarity (weight: number): string {
  if (weight >= 20) {
    return 'Common'
  } else if (weight >= 15) {
    return 'Uncommon'
  } else if (weight >= 10) {
    return 'Rare'
  } else {
    return 'Legendary'
  }
}

export function weightedRandom (prizes: Prize[]): Prize {
  const total = prizes.reduce((acc, val) => acc + val[2], 0)
  let r = Math.random() * total
  for (let i = 0; i < prizes.length; i++) {
    const p = prizes[i][2]
    if (r < p) return prizes[i]
    r -= p
  }
}

export function pickPrize () {
  const result = weightedRandom(prizeList)
  const rarity = weightToRarity(result[2])
  return [result[0], result[1], rarity]
}

export function testPrizePicking () {
  const results = {} as any
  for (let i = 0; i < 10000; i++) {
    const result = pickPrize()
    results[result[0]] = (result[0] in results ? results[result[0]] : 0) + 1
  }
  console.log(results)
}

export function incrementArcadeCredits (userid: string, amount: number) {
  const queryString = 'INSERT INTO arcade_currency VALUES(?, ?) ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount);'
  return queryHelper(queryString, [userid, amount])
}

export async function getArcadeCredits (userid: string): Promise<number> {
  const queryString = 'SELECT * FROM arcade_currency WHERE userid = ?;'
  const results = await queryHelper(queryString, [userid])
  if (results.length < 1 || !results[0]) {
    return 0
  }
  return (results[0].amount || 0)
}

export async function unlockArcadePrize (userid: string, prize: string) {
  const queryString = 'INSERT INTO arcade_prizes VALUES(?, ?, 1) ON DUPLICATE KEY UPDATE amount = amount + 1;'
  return queryHelper(queryString, [userid, prize])
}

export async function getArcadePrizes (userid: string): Promise<Record<string, number>> {
  const queryString = 'SELECT * FROM arcade_prizes WHERE discordid = ?;'
  const results = await queryHelper(queryString, [userid])
  const prizes : Record<string, number> = {}
  for (let i = 0; i < results.length; i++) {
    const name = results[i].prize
    const amount = results[i].amount
    prizes[name] = amount
  }
  return prizes
}

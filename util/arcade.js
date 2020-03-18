const pool = require('./database')
const prizeList = [
  ['redrocket', 'Toy Rocket (Red)', 25],
  ['greenrocket', 'Toy Rocket (Green)', 25],
  ['bowlingpin', 'Bowling Pin', 24],
  ['drum', 'Industrial Drum', 24],
  ['chocolate', 'Suspicious Chocolate', 22],
  ['cards', 'Deck of Cards', 20],
  ['dice', 'Fuzzy Dice', 20],

  ['tape3', 'Digital Casette', 18],
  ['purplerocket', 'Toy Rocket (Purple)', 18],
  ['bluerocket', 'Toy Rocket (Blue)', 18],
  ['redhat', 'Lvl 100 Boss Hat', 17],
  ['plant1', 'Magic Bloom', 16],
  ['oldbarrel', 'Ancient Barrel', 16],
  ['tape2', 'Future Casette', 15],

  ['coin', 'Fluffy Servers Token', 14],
  ['monitor', 'Broken Monitor', 13],
  ['toxicdrum', 'Corrosive Waste Drum', 13],
  ['gamebro', 'Gamebro', 12],
  ['mysteryorb', 'Mysterious Orb', 12],
  ['goldhat', 'Ringmaster\'s Hat', 11],
  ['tape1', 'Retro Casette', 10],

  ['mars', 'Mars', 9],
  ['plant2', 'Autumn Diamond', 9],
  ['fox', 'Plush Fox', 8],
  ['pluto', 'Pluto', 8],
  ['goldmonitor', 'Royal (Broken) Monitor', 7],
  ['tape4', 'Aesthetic Casette', 7],
  ['icefox', 'Ice Fox', 6],
  ['gamebrocolor', 'Gamebro Color', 6],
  ['infinityfox', 'Infinity Fox', 5]
]

function weightToRarity(weight) {
  if (weight >= 20) {
    return 'Common'
  } else if (weight >= 15) {
    return 'Uncommon'
  } else if (weight >= 10) {
    return 'Rare'
  } else if (weight >= 5) {
    return 'Legendary'
  } else {
    return 'Epic Legend'
  }
}

function weightedRandom(prizes) {
  const total = prizes.reduce((acc, val) => acc + val[2], 0)
  let r = Math.random() * total
  for (let i = 0; i < prizes.length; i++) {
    const p = prizes[i][2]
    if (r < p) return prizes[i]
    r -= p
  }
  return 0
}

function pickPrize() {
  const result = weightedRandom(prizeList)
  const rarity = weightToRarity(result[2])
  return [result[0], result[1], rarity]
}

function testPrizePicking() {
  let results = {}
  for (let i = 0; i < 10000; i++) {
    const result = pickPrize()
    results[result[0]] = (result[0] in results ? results[result[0]] : 0) + 1
  }
  console.log(results)
}

function incrementArcadeCredits(userid, amount) {
  const queryString = 'INSERT INTO arcade_currency VALUES(?, ?) ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount);'
  pool.query(queryString, [userid, amount], function (err, results) {
    if (err) {
      console.log(err)
    }
  })
}

function getArcadeCredits(userid) {
  return new Promise(function (resolve, reject) {
    const queryString = 'SELECT * FROM arcade_currency WHERE userid = ?;'
    pool.query(queryString, [userid], function (err, results) {
      if (err) {
        resolve(0)
      } else {
        if (results.length < 1 || !results[0]) {
          resolve(0)
          return
        }
        resolve(results[0].amount || 0)
      }
    })
  })
}

function unlockArcadePrize(userid, prize) {
  return new Promise(function (resolve, reject) {
    const queryString = 'INSERT INTO arcade_prizes VALUES(?, ?, 1) ON DUPLICATE KEY UPDATE amount = amount + 1;'
    pool.query(queryString, [userid, prize], function (err, results) {
      if (err) {
        console.log(err)
        reject(err)
      } else {
        resolve(results)
      }
    })
  })
}

function getArcadePrizes(userid) {
  return new Promise(function (resolve, reject) {
    const queryString = 'SELECT * FROM arcade_prizes WHERE discordid = ?;'
    pool.query(queryString, [userid], function (err, results) {
      if (err) {
        reject(err)
      } else {
        const prizes = {}
        for (let i = 0; i < results.length; i++) {
          const name = results[i].prize
          const amount = results[i].amount
          prizes[name] = amount
        }

        resolve(prizes)
      }
    })
  })
}

module.exports.incrementArcadeCredits = incrementArcadeCredits
module.exports.getArcadeCredits = getArcadeCredits
module.exports.incrementCredits = incrementArcadeCredits
module.exports.getCredits = getArcadeCredits
module.exports.getArcadePrizes = getArcadePrizes
module.exports.unlockArcadePrize = unlockArcadePrize
module.exports.pickPrize = pickPrize
module.exports.prizes = prizeList
const pool = require('./database')
const prizeList = {
  bowlingpin: ['Bowling Pin', 0],
  chocolate: ['Suspicious Chocolate', 0],
  redrocket: ['Toy Rocket (Red)', 0],
  greenrocket: ['Toy Rocket (Green)', 0],
  drum: ['Industrial Drum', 0],

  cards: ['Deck of Cards', 1],
  dice: ['Fuzzy Dice', 1],
  purplerocket: ['Toy Rocket (Purple)', 1],
  bluerocket: ['Toy Rocket (Blue)', 1],
  oldbarrel: ['Ancient Barrel', 1],

  coin: ['Fluffy Servers Token', 2],
  monitor: ['Broken Monitor', 2],
  toxicdrum: ['Corrosive Waste Drum', 2],
  gamebro: ['Gamebro', 2],
  mysteryorb: ['Mysterious Orb', 2],

  pluto: ['Pluto', 3],
  goldmonitor: ['Royal (Broken) Monitor', 3],
  fox: ['Plush Fox', 3],
  icefox: ['Ice Fox', 3],
  gamebrocolor: ['Gamebro Color', 3]
}

const prizeRarities = ['Common', 'Uncommon', 'Rare', 'Legendary']

function incrementArcadeCredits (userid, amount) {
  var queryString = 'INSERT INTO arcade_currency VALUES(?, ?) ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount);'
  pool.query(queryString, [userid, amount], function (err, results) {
    if (err) {
      console.log(err)
    }
  })
}

function getArcadeCredits (userid) {
  var p = new Promise(function (resolve, reject) {
    var queryString = 'SELECT * FROM arcade_currency WHERE userid = ?;'
    pool.query(queryString, [userid], function (err, results) {
      if (err) {
        resolve(0)
      } else {
        if (results.length < 1) resolve(0)
        resolve(results[0].amount || 0)
      }
    })
  })

  return p
}

function unlockArcadePrize (userid, prize) {
  if (!prizeList[prize]) return false

  var p = new Promise(function (resolve, reject) {
    var queryString = 'INSERT INTO arcade_prizes VALUES(?, ?, 1) ON DUPLICATE KEY UPDATE amount = amount + 1;'
    pool.query(queryString, [userid, prize], function (err, results) {
      if (err) {
        console.log(err)
      }
    })
  })

  return p
}

function getArcadePrizes (userid) {
  var p = new Promise(function (resolve, reject) {
    var queryString = 'SELECT * FROM arcade_prizes WHERE discordid = ?;'
    pool.query(queryString, [userid], function (err, results) {
      if (err) {
        reject(err)
      } else {
        var prizes = {}
        for (var i = 0; i < results.length; i++) {
          var name = results[i].prize
          var amount = results[i].amount
          prizes[name] = amount
        }

        resolve(prizes)
      }
    })
  })

  return p
}

module.exports.incrementArcadeCredits = incrementArcadeCredits
module.exports.getArcadeCredits = getArcadeCredits
module.exports.incrementCredits = incrementArcadeCredits
module.exports.getCredits = getArcadeCredits
module.exports.getArcadePrizes = getArcadePrizes
module.exports.unlockArcadePrize = unlockArcadePrize
module.exports.prizes = prizeList
module.exports.rarities = prizeRarities

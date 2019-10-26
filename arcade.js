const pool = require('./database')

function incrementArcadeCredits(userid, amount) {
    var query_string = "INSERT INTO arcade_currency VALUES(?, ?) ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount);"
    pool.query(query_string, [userid, amount], function(err, results) {
        if(err) {
            console.log(err)
        }
    })
}

function getArcadeCredits(userid) {
    var p = new Promise(function(resolve, reject) {
        var query_string = "SELECT * FROM arcade_currency WHERE userid = ?;"
        pool.query(query_string, [userid], function(err, results) {
            if(err) {
                reject(err)
            } else {
                if(results.length < 1) resolve(0)
                resolve(results[0].amount || 0)
            }
        })
    })
    
    return p
}

function unlockArcadePrize(userid, prize) {
    if(!prizeList[prize]) return false
    
    var p = new Promise(function(resolve, reject) {
        var query_string = "INSERT INTO arcade_prizes VALUES(?, ?, 1) ON DUPLICATE KEY UPDATE amount = amount + 1;"
        pool.query(query_string, [userid, prize], function(err, results) {
            if(err) {
                console.log(err)
            }
        })
    })
    
    return p
}

function getArcadePrizes(userid) {
    var p = new Promise(function(resolve, reject) {
        var query_string = "SELECT * FROM arcade_prizes WHERE discordid = ?;"
        pool.query(query_string, [userid], function(err, results) {
            if(err) {
                reject(err)
            } else {
                var prizes = {}
                for(var i=0; i<results.length; i++) {
                    var name = results[i]['prize']
                    var amount = results[i]['amount']
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
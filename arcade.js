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
    var query_string = "SELECT * FROM arcade_currency WHERE userid = ?"
        pool.query(query_string, [userid], function(err, results) {
            if(err) {
                reject(err)
            } else {
                resolve(results[0].amount || 0)
            }
        })
    })
    
    return p
}

module.exports.incrementArcadeCredits = incrementArcadeCredits
module.exports.getArcadeCredits = getArcadeCredits
module.exports.incrementCredits = incrementArcadeCredits
module.exports.getCredits = getArcadeCredits
const ticket = require('../../commands/ticket.js')

module.exports = {
  description: 'Handles revoking tickets after a given amount of time',
  frequency: 1,
  execute(client) {
    if (!client.ticketData) return

    client.ticketData.forEach(function (data, id) {
      // Revoke each ticket if sufficient time has passed
      if (Date.now() > data.revoke.getTime()) {
        ticket.unticket(client, id)
      }
    })
  }
}

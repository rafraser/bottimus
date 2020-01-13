const testingChannel = '583635933585342466'

module.exports = {
  description: 'Restricts the testing bot to a specific channel and vice versa',
  execute (message, client) {
    return (message.channel.id === testingChannel) === (client.testingMode)
  }
}

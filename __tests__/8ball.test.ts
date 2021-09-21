import command, { getRandomInt } from '../src/commands/8ball'
import { MockClient, MockMessage } from '../__mocks__'

test('test random generator handles single case correctly', () => {
  expect(getRandomInt(2, 2)).toBe(2)
})

test('test random generator stays within range', () => {
  const result = getRandomInt(0, 100)
  expect(result).toBeGreaterThanOrEqual(0)
  expect(result).toBeLessThanOrEqual(100)
})

test('8ball sends an image back', () => {
  const msg = new MockMessage()
  const client = new MockClient()
  command.execute(client as any, msg as any, [])
  expect(msg.channel.messages).toHaveLength(1)
  expect(msg.channel.messages[0]).toHaveProperty('content.attachment')
})

test('8ball updates cooldown', () => {
  const msg = new MockMessage()
  const client = new MockClient()
  command.execute(client as any, msg as any, [])
  expect(client.cooldowns.keys()).toContain(command.name)
  expect(client.cooldowns.get(command.name).keys()).toContain(msg.member.id)
})

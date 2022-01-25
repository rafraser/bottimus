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

test('8ball sends an image back', async () => {
  const msg = new MockMessage()
  const client = new MockClient()
  await command.execute(client as any, msg as any, [])
  expect(msg.channel.messages).toHaveLength(1)
  expect(msg.channel.messages[0]).toHaveProperty('files[0].attachment')
})

test('8ball updates cooldown', async () => {
  const msg = new MockMessage()
  const client = new MockClient()
  await command.execute(client as any, msg as any, [])
  expect(client.cooldowns.keys()).toContain(command.name)
  expect(client.cooldowns.get(command.name).keys()).toContain(msg.member.id)
})
import command from '../src/commands/catfact'
import { MockClient, MockMessage } from '../__mocks__'
import fetch from 'node-fetch'

jest.mock('node-fetch')
jest.mocked(fetch).mockImplementation((): Promise<any> => {
  return Promise.resolve({
    json () {
      return Promise.resolve({ fact: 'Cats have four legs.' })
    }
  })
})

test('catfact sends an embed back', async () => {
  const msg = new MockMessage()
  const client = new MockClient()
  await command.execute(client as any, msg as any, [])
  expect(msg.channel.messages).toHaveLength(1)
  expect(msg.channel.messages[0]).toHaveProperty('embeds[0].description', 'Cats have four legs.')
})

test('catfact updates cooldown', async () => {
  const msg = new MockMessage()
  const client = new MockClient()
  await command.execute(client as any, msg as any, [])
  expect(client.cooldowns.keys()).toContain(command.name)
  expect(client.cooldowns.get(command.name).keys()).toContain(msg.member.id)
})

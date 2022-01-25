import { weightToRarity } from '../src/arcade'

test('test weight to rarity', () => {
  expect(weightToRarity(28)).toBe('Common')
  expect(weightToRarity(16)).toBe('Uncommon')
  expect(weightToRarity(12)).toBe('Rare')
  expect(weightToRarity(5)).toBe('Legendary')
})

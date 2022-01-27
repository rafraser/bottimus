import { advantageRoll, disadvantageRoll, rollArray, sumArray, parseAndRoll } from '../src/commands/dice'

test('rolling an array of dice', () => {
  jest.spyOn(global.Math, 'random').mockReturnValue(0.999)
  expect(rollArray(5, 6)).toHaveLength(5)
  expect(rollArray(3, 6)).toEqual([6, 6, 6])
  expect(rollArray(1, 10)).toEqual([10])
  jest.spyOn(global.Math, 'random').mockRestore()
})

test('summing an array of dice', () => {
  expect(sumArray([1, 2, 3])).toEqual(6)
  expect(sumArray([4, 5, 6])).toEqual(15)
  expect(sumArray([1])).toEqual(1)
  expect(sumArray([])).toEqual(0)
})

test('advantage rolls', () => {
  expect(advantageRoll([1, 4, 2, 3])).toEqual([[4, 3, 2, 1], 7])
  expect(advantageRoll([18, 4])).toEqual([[18, 4], 18])
  expect(advantageRoll([5, 5, 5, 7, 7, 10])).toEqual([[10, 7, 7, 5, 5, 5], 24])
})

test('disadvantage rolls', () => {
  expect(disadvantageRoll([1, 4, 2, 3])).toEqual([[1, 2, 3, 4], 3])
  expect(disadvantageRoll([18, 4])).toEqual([[4, 18], 4])
  expect(disadvantageRoll([5, 5, 5, 7, 7, 10])).toEqual([[5, 5, 5, 7, 7, 10], 15])
})

test('dice parsing', () => {
  jest.spyOn(global.Math, 'random').mockReturnValue(0.999)
  expect(parseAndRoll('d20')).toEqual([[20], 20])
  expect(parseAndRoll('2d6')).toEqual([[6, 6], 12])
  expect(parseAndRoll('5')).toEqual([[5], 5])
  jest.spyOn(global.Math, 'random').mockRestore()
})

import { miningPrizeCheck } from '../src/commands/mine'

test('mining prize checks work as expected', async () => {
  jest.spyOn(global.Math, 'random').mockReturnValue(0.92)
  expect(miningPrizeCheck(false)[0]).toEqual('oregold')
  expect(miningPrizeCheck(true)[0]).toEqual('oregreen')

  jest.spyOn(global.Math, 'random').mockReturnValue(0.125)
  expect(miningPrizeCheck(false)).toBeNull()
  expect(miningPrizeCheck(true)).toBeNull()

  jest.spyOn(global.Math, 'random').mockRestore()
})

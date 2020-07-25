import { nbsCurrencyService } from '../src/currencies/nbs'
import { toNaiveDate } from '../src/dates'
import { CurrencyCode } from '../src/currencies'

describe('nbs currency services', () => {
  it('End-to-end remote test', async () => {
    const rate = await nbsCurrencyService(toNaiveDate('2020-07-16'), CurrencyCode.EUR)
    expect(rate).toBeCloseTo(117.595, 3)
  })
})

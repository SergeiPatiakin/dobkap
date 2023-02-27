import moment from 'moment'
import path from 'path'
import { formatNaiveDate } from '../src/dates'
import { ibkrImporter } from '../src/importers/ibkr'

describe('ibkrImporter', () => {
  it('basic - full report', async () => {
    const r = await ibkrImporter(path.join(__dirname, 'data/ibkr-full1.csv'))
    expect(r).toMatchObject(      [
      {
        incomeCurrencyCode: 'EUR',
        payingEntity: 'ABC',
        incomeCurrencyAmount: 60,
        whtCurrencyCode: 'EUR',
        whtCurrencyAmount: 6
      }
    ])
    expect(formatNaiveDate(r[0].incomeDate)).toBe('2023-01-12')
  })
  it('basic - dividends section', async () => {
    const r = await ibkrImporter(path.join(__dirname, 'data/ibkr-section1.csv'))
    expect(r).toMatchObject(      [
      {
        incomeCurrencyCode: 'EUR',
        payingEntity: 'ABC',
        incomeCurrencyAmount: 60,
        whtCurrencyCode: 'EUR',
        whtCurrencyAmount: 6
      }
    ])
    expect(formatNaiveDate(r[0].incomeDate)).toBe('2023-01-12')
  })
})

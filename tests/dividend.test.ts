import { getDividendIncomeInfo } from '../src/dividend'
import { CurrencyServiceRepository, CurrencyCode } from '../src/currencies'
import moment from 'moment'

const mockCurrencyServiceRepo: CurrencyServiceRepository = {
  EUR: async () => 120,
  GBP: async () => 140,
  USD: async () => 110,
}

describe('getDividendIncomeInfo', () => {
  it('some tax payable', async () => {
    const mockDate = moment()
    const result = await getDividendIncomeInfo(
      mockCurrencyServiceRepo,
      {
        payingEntity: 'BMW',
        currencyDividendAmount: 200.0,
        currencyCode: CurrencyCode.EUR,
        currencyWithholdingTaxAmount: 20.0,
        paymentDate: mockDate,
      }
    )
    expect(result).toEqual({
      payingEntity: 'BMW',
      paymentDate: mockDate,
      grossDividend: {cents: BigInt(120 * 200 * 100)},
      grossTaxPayable: {cents: BigInt(120 * 30 * 100)},
      taxPaidAbroad: {cents: BigInt(120 * 20 * 100)},
      taxPayable: {cents: BigInt(120 * 10 * 100)},
    })
  })
  it('no tax payable', async () => {
    const mockDate = moment()
    const result = await getDividendIncomeInfo(
      mockCurrencyServiceRepo,
      {
        payingEntity: 'BMW',
        currencyDividendAmount: 200.0,
        currencyCode: CurrencyCode.EUR,
        currencyWithholdingTaxAmount: 52.0,
        paymentDate: mockDate,
      }
    )
    expect(result).toEqual({
      payingEntity: 'BMW',
      paymentDate: mockDate,
      grossDividend: {cents: BigInt(120 * 200 * 100)},
      grossTaxPayable: {cents: BigInt(120 * 200 * 100 * 0.15)},
      taxPaidAbroad: {cents: BigInt(120 * 52 * 100)},
      taxPayable: {cents: BigInt(0)},
    })
  })
})

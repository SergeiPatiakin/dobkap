import { getDividendIncomeInfo } from '../src/dividend'
import moment from 'moment'
import { CurrencyService } from '../src/currencies'
import { CurrencyCode } from '../src/data-types'

const mockCurrencyServiceRepo: CurrencyService = async () => 120

describe('getDividendIncomeInfo', () => {
  it('some tax payable', async () => {
    const mockDate = moment()
    const result = await getDividendIncomeInfo(
      mockCurrencyServiceRepo,
      {
        payingEntity: 'BMW',
        dividendCurrencyCode: CurrencyCode.EUR,
        dividendCurrencyAmount: 200.0,
        whtCurrencyCode: CurrencyCode.EUR,
        whtCurrencyAmount: 20.0,
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
        dividendCurrencyCode: CurrencyCode.EUR,
        dividendCurrencyAmount: 200.0,
        whtCurrencyCode: CurrencyCode.EUR,
        whtCurrencyAmount: 52.0,
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

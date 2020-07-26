import { fillOpoForm } from '../src/eporezi'
import { toNaiveDate } from '../src/dates'

describe('fillOpoForm', () => {
  it('basic', () => {
    const result = fillOpoForm({
      dividendIncomeInfo: {
        paymentDate: toNaiveDate('2020-07-16'),
      },
    } as any)
    console.log(result.toString())
  })
})

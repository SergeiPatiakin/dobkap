import { fillOpoForm } from '../src/eporezi'
import { toNaiveDate } from '../src/dates'
import { fromCurrency } from '../src/rsd-amount'

describe('fillOpoForm', () => {
  it('basic', () => {
    const result = fillOpoForm({
      fullName: 'Jован Jовановић',
      streetAddress: 'Terazije 1/1',
      phoneNumber: '0611111111',
      email: 'jovan@example.com',
      opstinaCode: '016',
      jmbg: '1234567890123',
      filerJmbg: '1234567890123',
      realizationMethod: 'Isplata na brokerski racun',
      filingDeadline: toNaiveDate('2020-08-16'),
      dividendIncomeInfo: {
        payingEntity: 'BMW',
        grossDividend: fromCurrency(117, 100),
        grossTaxPayable: fromCurrency(117, 15),
        taxPaidAbroad: fromCurrency(117, 26),
        taxPayable: fromCurrency(117, 0),
        paymentDate: toNaiveDate('2020-07-16'),
      },
    })
    expect(result).toBeTruthy()
  })
})

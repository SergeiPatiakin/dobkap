import { NaiveDate, CurrencyCode } from "./data-types";
import { CurrencyService } from "./currencies";
import * as Rsd from "./rsd-amount";
import { RsdAmount } from "./rsd-amount";

export const PASSIVE_INCOME_TAX_RATE = 0.15

export interface PassiveIncomeInfo {
  payingEntity: string
  incomeDate: NaiveDate
  incomeCurrencyCode: CurrencyCode
  incomeCurrencyAmount: number
  whtCurrencyCode: CurrencyCode
  whtCurrencyAmount: number
}

export interface PassiveIncomeFilingInfo {
  payingEntity: string
  incomeDate: NaiveDate
  grossIncome: RsdAmount
  taxPaidAbroad: RsdAmount
  grossTaxPayable: RsdAmount
  taxPayable: RsdAmount
}

export const getPassiveIncomeFilingInfo = async (
  currencyService: CurrencyService,
  passiveIncomeInfo: PassiveIncomeInfo,
): Promise<PassiveIncomeFilingInfo> => {
  const {
    payingEntity,
    incomeDate: paymentDate,
    incomeCurrencyCode: dividendCurrencyCode,
    incomeCurrencyAmount: dividendCurrencyAmount,
    whtCurrencyCode,
    whtCurrencyAmount,
  } = passiveIncomeInfo
  
  const dividendExchangeRate = await currencyService(paymentDate, dividendCurrencyCode)
  const grossDividend = Rsd.fromCurrency(dividendExchangeRate, dividendCurrencyAmount)
  
  const whtExchangeRate = await currencyService(paymentDate, whtCurrencyCode)
  const taxPaidAbroad = Rsd.fromCurrency(whtExchangeRate, whtCurrencyAmount)
  
  const grossTaxPayable = Rsd.multiply(PASSIVE_INCOME_TAX_RATE)(grossDividend)
  const taxPayable = Rsd.map2((grossPayable, paidAbroad) => paidAbroad > grossPayable
    ? BigInt(0)
    : grossPayable - paidAbroad)(grossTaxPayable, taxPaidAbroad)
  return {
    payingEntity,
    incomeDate: paymentDate,
    grossIncome: grossDividend,
    taxPaidAbroad,
    grossTaxPayable,
    taxPayable,
  }
}

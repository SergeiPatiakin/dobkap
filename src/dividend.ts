import { NaiveDate, CurrencyCode } from "./data-types";
import { CurrencyServiceRepository } from "./currencies";
import * as Rsd from "./rsd-amount";
import { RsdAmount } from "./rsd-amount";

export const DIVIDEND_TAX_RATE = 0.15

export interface DividendInfo {
  payingEntity: string
  paymentDate: NaiveDate
  currencyCode: CurrencyCode
  currencyDividendAmount: number
  currencyWithholdingTaxAmount: number
}

export interface DividendIncomeInfo {
  payingEntity: string
  paymentDate: NaiveDate
  grossDividend: RsdAmount
  taxPaidAbroad: RsdAmount
  grossTaxPayable: RsdAmount
  taxPayable: RsdAmount
}

export const getDividendIncomeInfo = async (currencyServiceRepo: CurrencyServiceRepository, dividendInfo: DividendInfo): Promise<DividendIncomeInfo> => {
  const {payingEntity, paymentDate, currencyCode, currencyDividendAmount, currencyWithholdingTaxAmount } = dividendInfo
  const currencyService = currencyServiceRepo[currencyCode]
  const exchangeRate = await currencyService(paymentDate)
  const grossDividend = Rsd.fromCurrency(exchangeRate, currencyDividendAmount)
  const taxPaidAbroad = Rsd.fromCurrency(exchangeRate, currencyWithholdingTaxAmount)
  const grossTaxPayable = Rsd.multiply(DIVIDEND_TAX_RATE)(grossDividend)
  const taxPayable = Rsd.map2((grossPayable, paidAbroad) => paidAbroad > grossPayable ? BigInt(0) : grossPayable - paidAbroad)(grossTaxPayable, taxPaidAbroad)
  return {
    payingEntity,
    paymentDate,
    grossDividend,
    taxPaidAbroad,
    grossTaxPayable,
    taxPayable,
  }
}

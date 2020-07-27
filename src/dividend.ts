import { NaiveDate, CurrencyCode } from "./data-types";
import { CurrencyService } from "./currencies";
import * as Rsd from "./rsd-amount";
import { RsdAmount } from "./rsd-amount";

export const DIVIDEND_TAX_RATE = 0.15

export interface DividendInfo {
  payingEntity: string
  paymentDate: NaiveDate
  dividendCurrencyCode: CurrencyCode
  dividendCurrencyAmount: number
  whtCurrencyCode: CurrencyCode
  whtCurrencyAmount: number
}

export interface DividendIncomeInfo {
  payingEntity: string
  paymentDate: NaiveDate
  grossDividend: RsdAmount
  taxPaidAbroad: RsdAmount
  grossTaxPayable: RsdAmount
  taxPayable: RsdAmount
}

export const getDividendIncomeInfo = async (currencyService: CurrencyService, dividendInfo: DividendInfo): Promise<DividendIncomeInfo> => {
  const {payingEntity, paymentDate, dividendCurrencyCode, dividendCurrencyAmount, whtCurrencyCode, whtCurrencyAmount } = dividendInfo
  
  const dividendExchangeRate = await currencyService(paymentDate, dividendCurrencyCode)
  const grossDividend = Rsd.fromCurrency(dividendExchangeRate, dividendCurrencyAmount)
  
  const whtExchangeRate = await currencyService(paymentDate, whtCurrencyCode)
  const taxPaidAbroad = Rsd.fromCurrency(whtExchangeRate, whtCurrencyAmount)
  
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

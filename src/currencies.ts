import { NaiveDate } from "./data-types"

export enum CurrencyCode {
  EUR = 'EUR',
  GBP = 'GBP',
  USD = 'USD',
}

export type CurrencyService = (date: NaiveDate) => Promise<number>

export type CurrencyServiceRepository = {[K in CurrencyCode]: CurrencyService}

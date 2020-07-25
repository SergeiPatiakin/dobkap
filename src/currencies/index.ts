import { NaiveDate, CurrencyCode } from "../data-types"
import { nbsCurrencyService } from "./nbs"

export type CurrencyService = (date: NaiveDate) => Promise<number>

export type CurrencyServiceRepository = {[K in CurrencyCode]: CurrencyService}

export const currencyService = async (day: NaiveDate, currencyCode: CurrencyCode): Promise<number> => {
  return nbsCurrencyService(day, currencyCode)
}

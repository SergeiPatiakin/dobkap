import { NaiveDate, CurrencyCode } from "../data-types"
import { nbsCurrencyService } from "./nbs"

export const currencyService = async (day: NaiveDate, currencyCode: CurrencyCode): Promise<number> => {
  return nbsCurrencyService(day, currencyCode)
}

export type CurrencyService = typeof currencyService

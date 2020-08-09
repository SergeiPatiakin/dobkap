import { NaiveDate, CurrencyCode } from "../data-types"
import { nbsCurrencyService } from "./nbs"
import { formatNaiveDate } from "../dates"
import { singaporeMasCurrencyService } from "./singapore-mas"
const Cache = require('async-disk-cache')

const cache = new Cache('DobkapCurrencyService')

export const currencyService = async (day: NaiveDate, currencyCode: CurrencyCode): Promise<number> => {
  const cacheKey = `${formatNaiveDate(day)}-${currencyCode}`
  if (await cache.has(cacheKey)){
    const { value } = await cache.get(cacheKey)
    return value
  } else {
    let value
    if (currencyCode === 'SGD') {
      // Use USD as an intermediate currency
      const usdSgd = await singaporeMasCurrencyService(day, CurrencyCode.USD)
      const usdRsd = await currencyService(day, CurrencyCode.USD)
      value = usdRsd / usdSgd
    } else {
      value = await nbsCurrencyService(day, currencyCode)
    }
    await cache.set(cacheKey, value)
    return value
  }
}

export const clearCache = async () => {
  await cache.clear()
}

export type CurrencyService = typeof currencyService

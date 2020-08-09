import { NaiveDate, CurrencyCode } from "../data-types"
import { nbsCurrencyService } from "./nbs"
import { formatNaiveDate } from "../dates"
import { singaporeMasCurrencyService } from "./singapore-mas"
import { mexicoBdmCurrencyService } from "./mexico-bdm"
const Cache = require('async-disk-cache')

const cache = new Cache('DobkapCurrencyService')

interface ApiTokens {
  mexicoBdmToken: string
}

export const currencyServiceFactory = (apiTokens: Partial<ApiTokens>) => async (day: NaiveDate, currencyCode: CurrencyCode): Promise<number> => {
  const cacheKey = `${formatNaiveDate(day)}-${currencyCode}`
  if (await cache.has(cacheKey)){
    const { value } = await cache.get(cacheKey)
    return value
  } else {
    let value
    if (currencyCode === CurrencyCode.SGD) {
      // Use USD as an intermediate currency
      const usdSgd = await singaporeMasCurrencyService(day, CurrencyCode.USD)
      const usdRsd = await currencyServiceFactory(apiTokens)(day, CurrencyCode.USD)
      value = usdRsd / usdSgd
    } else if (currencyCode === CurrencyCode.MXN) {
      if (!apiTokens.mexicoBdmToken){
        throw new Error('Token required')
      }
      // Use USD as an intermediate currency
      const usdSgd = await mexicoBdmCurrencyService(apiTokens.mexicoBdmToken, day, CurrencyCode.USD)
      const usdRsd = await currencyServiceFactory(apiTokens)(day, CurrencyCode.USD)
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

export type CurrencyService = (day: NaiveDate, currencyCode: CurrencyCode) => Promise<number>

import { NaiveDate, CurrencyCode } from "../data-types"
import { nbsCurrencyService } from "./nbs"
import { formatNaiveDate } from "../dates"
import { singaporeMasCurrencyService } from "./singapore-mas"
import { mexicoBdmCurrencyService } from "./mexico-bdm"

interface ApiTokens {
  mexicoBdmToken: string
}

interface AsyncCache {
  has: (key: string) => Promise<boolean>
  get: (key: string) => Promise<any>
  set: (key: string, value: any) => Promise<void>
}

export const createCurrencyService = (apiTokens: Partial<ApiTokens>, cache?: AsyncCache) => async (day: NaiveDate, currencyCode: CurrencyCode): Promise<number> => {
  const cacheKey = `${formatNaiveDate(day)}-${currencyCode}`
  if (cache && await cache.has(cacheKey)){
    const { value } = await cache.get(cacheKey)
    return value
  } else {
    let value
    if (currencyCode === CurrencyCode.SGD) {
      // Use USD as an intermediate currency
      const usdSgd = await singaporeMasCurrencyService(day, CurrencyCode.USD)
      const usdRsd = await createCurrencyService(apiTokens)(day, CurrencyCode.USD)
      value = usdRsd / usdSgd
    } else if (currencyCode === CurrencyCode.MXN) {
      if (!apiTokens.mexicoBdmToken){
        throw new Error('Token required')
      }
      // Use USD as an intermediate currency
      const usdSgd = await mexicoBdmCurrencyService(apiTokens.mexicoBdmToken, day, CurrencyCode.USD)
      const usdRsd = await createCurrencyService(apiTokens)(day, CurrencyCode.USD)
      value = usdRsd / usdSgd
    } else {
      value = await nbsCurrencyService(day, currencyCode)
    }
    if (cache) {
      await cache.set(cacheKey, value)
    }
    return value
  }
}

export type CurrencyService = (day: NaiveDate, currencyCode: CurrencyCode) => Promise<number>

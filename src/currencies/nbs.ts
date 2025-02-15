import got from 'got'
import { NaiveDate, CurrencyCode } from '../data-types'
const jsdom = require('jsdom')
const { JSDOM } = jsdom

const nbsCurrencyCodeMapping: Map<string, CurrencyCode> = new Map([
  ['EUR', CurrencyCode.EUR],
  ['GBP', CurrencyCode.GBP],
  ['USD', CurrencyCode.USD],
  ['AED', CurrencyCode.AED],
  ['AUD', CurrencyCode.AUD],
  ['CAD', CurrencyCode.CAD],
  ['CHF', CurrencyCode.CHF],
  ['CZK', CurrencyCode.CZK],
  ['DKK', CurrencyCode.DKK],
  ['HUF', CurrencyCode.HUF],
  ['JPY', CurrencyCode.JPY],
  ['NOK', CurrencyCode.NOK],
  ['PLN', CurrencyCode.PLN],
  ['SEK', CurrencyCode.SEK],
  ['TRY', CurrencyCode.TRY],
])

export const nbsSupportedCurrencies = [...nbsCurrencyCodeMapping.values()]

export const nbsCurrencyService = async (day: NaiveDate, currencyCode: CurrencyCode) => {
  let url = `https://webappcenter.nbs.rs/WebApp/ExchangeRate/ExchangeRate?isSearchExecuted=true&Date=${day.format('DD.MM.YYYY')}&ExchangeRateListTypeID=3`
  const result = await got.get(url, {
    // headers: {
    //   Cookie: `JSESSIONID=${jsessionid}`
    // },
    // form,
  })

  const dom = new JSDOM(result.body)
  const y = dom.window.document.querySelectorAll("table tr")
  const exchangeRates = Array.from(y).flatMap((ye: any) => {
    const nbsCurrencyCode = ye.children[0].innerHTML
    if (nbsCurrencyCode.length > 1 && nbsCurrencyCode.length <= 5) { // Filter out header ETC
      return [{
        nbsCurrencyCode,
        scaleFactor: Number(ye.children[3].innerHTML),
        scaledExchangeRate: Number(ye.children[4].innerHTML.replace(',', '.')),
      }]
    } else {
      return []
    }
  })

  const exchangeRate = exchangeRates.find(x => x.nbsCurrencyCode === currencyCode)!

  return exchangeRate.scaledExchangeRate / exchangeRate.scaleFactor
}

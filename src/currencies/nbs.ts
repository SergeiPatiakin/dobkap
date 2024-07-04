import got from 'got'
import { NaiveDate, CurrencyCode } from '../data-types'
import { XMLParser } from 'fast-xml-parser'

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
  const prelimResult = await got.get('https://nbs.rs/kursnaListaModul/naZeljeniDan.faces')

  // TODO: can we just hard-code values for jsessionid and viewState?
  const jessionidRegex = /jsessionid=([0-9A-F]+)/g // MUTABLE!!!
  const jsessionid = jessionidRegex.exec(prelimResult.body)![1]

  const viewStateRegex = /id="j_id1:javax.faces.ViewState:0" value="([-0-9A-F\:]+)"/g // MUTABLE!!!
  const viewState = viewStateRegex.exec(prelimResult.body)![1]
  
  const form = {
    'index': 'index',
    'index:brKursneListe': '',
    'index:yearInner': day.format('YYYY'),
    'index:inputCalendar1': day.format('DD/MM/YYYY'),
    'index:vrstaInner': '3',
    'index:prikazInner': '3',
    'index:buttonShow': '',
    'javax.faces.ViewState': viewState,
  }

  const result = await got.post('https://nbs.rs/kursnaListaModul/naZeljeniDan.faces', {
    headers: {
      Cookie: `JSESSIONID=${jsessionid}`
    },
    form,
  })

  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false })
  const document = parser.parse(result.body)
  
  const nbsExchangeRates = document['Exchange_Rates_List']['Item'].map((c: any) => ({
    nbsCurrencyCode: c['Currency'],
    scaleFactor: Number(c['Unit']),
    scaledExchangeRate: Number(c['Middle_Rate']),
  })) as Array<{
    nbsCurrencyCode: string,
    scaleFactor: number,
    scaledExchangeRate: number,
  }>

  const exchangeRates = nbsExchangeRates.map(
    ({nbsCurrencyCode, scaleFactor, scaledExchangeRate}) => ({
      currencyCode: nbsCurrencyCodeMapping.get(nbsCurrencyCode),
      exchangeRate: scaledExchangeRate / scaleFactor
    })
  ).filter(x => x.currencyCode)
  // TODO: cache entries in exchangeRates

  const exchangeRate = exchangeRates.find(x => x.currencyCode === currencyCode)!.exchangeRate

  return exchangeRate
}

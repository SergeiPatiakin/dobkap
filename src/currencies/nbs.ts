import got from 'got'
import { NaiveDate } from '../data-types'
import xmldoc from 'xmldoc'
import { CurrencyCode } from '.'

const nbsCurrencyCodeMapping: Map<string, CurrencyCode> = new Map([
  ['EUR', CurrencyCode.EUR],
  ['GBP', CurrencyCode.GBP],
  ['USD', CurrencyCode.USD],
])

export const nbsCurrencyService = async (day: NaiveDate, currencyCode: CurrencyCode) => {
  const prelimResult = await got.get('https://nbs.rs/kursnaListaModul/naZeljeniDan.faces')

  // TODO: can we just hard-code values for jsessionid and viewState?
  const jessionidRegex = /jsessionid=([0-9A-F]+)/g // MUTABLE!!!
  const jsessionid = jessionidRegex.exec(prelimResult.body)![1]

  const viewStateRegex = /id="javax.faces.ViewState" value="([-0-9A-F\:]+)"/g // MUTABLE!!!
  const viewState = viewStateRegex.exec(prelimResult.body)![1]
  
  const form = {
    'index': 'index',
    'index:brKursneListe': '',
    'index:year': day.format('YYYY'),
    'index:inputCalendar1': day.format('DD/MM/YYYY'),
    'index:vrsta': '3',
    'index:prikaz': '3',
    'index:buttonShow': 'Прикажи',
    'javax.faces.ViewState': viewState,
  }

  const result = await got.post('https://nbs.rs/kursnaListaModul/naZeljeniDan.faces', {
    headers: {
      Cookie: `JSESSIONID=${jsessionid}`
    },
    form,
  })
  const document = new xmldoc.XmlDocument(result.body)
  const nbsExchangeRates = document.childrenNamed('Item')!.map(item => ({
    nbsCurrencyCode: item.childNamed('Currency')!.val,
    scaleFactor: Number(item.childNamed('Unit')!.val),
    scaledExchangeRate: Number(item.childNamed('Middle_Rate')!.val),
  }))
  const exchangeRates = nbsExchangeRates.map(
    ({nbsCurrencyCode, scaleFactor, scaledExchangeRate}) => ({
      currencyCode: nbsCurrencyCodeMapping.get(nbsCurrencyCode)!,
      exchangeRate: scaledExchangeRate / scaleFactor
    })
  )
  // TODO: cache entries in exchangeRates
  return exchangeRates.find(x => x.currencyCode === currencyCode)!.exchangeRate
}

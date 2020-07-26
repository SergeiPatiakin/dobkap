import got from 'got'
import { NaiveDate, CurrencyCode } from '../data-types'
import libxml, {Element} from 'libxmljs'

const nbsCurrencyCodeMapping: Map<string, CurrencyCode> = new Map([
  ['EUR', CurrencyCode.EUR],
  ['GBP', CurrencyCode.GBP],
  ['USD', CurrencyCode.USD],
])

export const nbsSupportedCurrencies = [...nbsCurrencyCodeMapping.values()]

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
  const document = libxml.parseXmlString(result.body)
  const children = document!.root()!.childNodes() as Element[];

  const nbsExchangeRates = children.filter(c => c.name() === 'Item').map(c => ({
    nbsCurrencyCode: (c.childNodes() as Element[]).filter(x => x.name() === 'Currency')[0].child(0)!.toString(),
    scaleFactor: Number((c.childNodes() as Element[]).filter(x => x.name() === 'Unit')[0].child(0)!.toString()),
    scaledExchangeRate: Number((c.childNodes() as Element[]).filter(x => x.name() === 'Middle_Rate')[0].child(0)!.toString()),
  }))
  const exchangeRates = nbsExchangeRates.map(
    ({nbsCurrencyCode, scaleFactor, scaledExchangeRate}) => ({
      currencyCode: nbsCurrencyCodeMapping.get(nbsCurrencyCode),
      exchangeRate: scaledExchangeRate / scaleFactor
    })
  ).filter(x => x.currencyCode)
  // TODO: cache entries in exchangeRates
  return exchangeRates.find(x => x.currencyCode === currencyCode)!.exchangeRate
}

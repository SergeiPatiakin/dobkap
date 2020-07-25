import got from 'got'

export const nbsCurrencyService = async () => {
  const prelimResult = await got.get('https://nbs.rs/kursnaListaModul/naZeljeniDan.faces')
  const jessionidRegex = /jsessionid=([0-9A-F]+)/g // MUTABLE!!!
  const jsessionid = jessionidRegex.exec(prelimResult.body)![1]

  const viewStateRegex = /id="javax.faces.ViewState" value="([-0-9A-F\:]+)"/g // MUTABLE!!!
  const viewState = viewStateRegex.exec(prelimResult.body)![1]
  
  const form = {
    'index': 'index',
    'index:brKursneListe': '',
    'index:year': '2020',
    'index:inputCalendar1': '16/07/2020',
    'index:vrsta': '3',
    'index:prikaz': '0',
    'index:buttonShow': 'Прикажи',
    'javax.faces.ViewState': viewState,
  }

  const result = await got.post('https://nbs.rs/kursnaListaModul/naZeljeniDan.faces', {
    headers: {
      Cookie: `JSESSIONID=${jsessionid}`
    },
    form
  })
  console.log(result.body)
}

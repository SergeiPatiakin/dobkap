import got from 'got'
import { NaiveDate, CurrencyCode } from "../data-types"
import * as assert from 'assert'

export const singaporeMasCurrencyService = async (day: NaiveDate, currencyCode: CurrencyCode) => {
  const result = await got.get(`https://eservices.mas.gov.sg/api/action/datastore/search.json?resource_id=95932927-c8bc-4e7a-b484-68a66a24edfe&filters[end_of_day]=${day.format('YYYY-MM-DD')}`)
  const resultBody = JSON.parse(result.body)
  assert.equal(currencyCode, CurrencyCode.USD)
  assert.equal(resultBody.result.total, 1)
  return parseFloat(resultBody.result.records[0].usd_sgd)
}

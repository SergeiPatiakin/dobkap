import csv from 'csv-parser'
import fs from 'fs'
import { DividendInfo } from '../dividend'
import { DayString, CurrencyCode, NaiveDate } from '../data-types'
import { toNaiveDate } from '../dates'

const parseCsvFile = async (filePath: string): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    const results: string[][] = []
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', x => {
        results.push(x)
      })
      .on('end', () => {
        resolve(results)
      })
  })
}

export const ibkrImporter = async (inputFile: string): Promise<DividendInfo[]> => {
  const fileContents = await parseCsvFile(inputFile)
  
  const dividendSectionStartIndex = fileContents.findIndex(x =>
    x[0] === 'Dividends'
    && x[1] === 'Header'
    && x[2] === 'Currency'
    && x[3] === 'Date'
    && x[4] === 'Description'
    && x[5] === 'Amount'
  )
  const dividendInfos: (Omit<DividendInfo, 'currencyWithholdingTaxAmount'> & {payingEntityIsin: string})[] = []
  const isDividendRow = (row: string[]) => row[0] === 'Dividends' && row[1] === 'Data' && row[2] !== 'Total'
  for(let dividendRowIndex = dividendSectionStartIndex + 1; isDividendRow(fileContents[dividendRowIndex]); dividendRowIndex++){
    const row = fileContents[dividendRowIndex]
    const currencyCode: CurrencyCode = row[2] as CurrencyCode
    const paymentDate: NaiveDate = toNaiveDate(row[3]) // TODO: decode to day string first?
    const parsedEntityName = row[4].match(/^([0-9A-Za-z]+)\(([0-9A-Za-z]+)\)/)!
    console.log({parsedEntityName})
    const payingEntity = parsedEntityName[1]
    const payingEntityIsin = parsedEntityName[2]
    const currencyDividendAmount = parseFloat(row[5])
    dividendInfos.push({currencyCode, paymentDate, payingEntity, payingEntityIsin, currencyDividendAmount})
  }

  const withholdingTaxSectionStartIndex = fileContents.findIndex(x => x.join(',') === 'Withholding Tax,Header,Currency,Date,Description,Amount,Code')
  // TODO: parse withholding tax rows
  // TODO: merge withholding tax rows with dividend rows

  return [{} as any]
}

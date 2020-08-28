import csv from 'csv-parser'
import fs from 'fs'
import { DividendInfo } from '../dividend'
import { CurrencyCode, NaiveDate } from '../data-types'
import { toNaiveDate, formatNaiveDate } from '../dates'

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

  const toDividendKey = (date: NaiveDate, entityName: string, entityIsin: string) => `${formatNaiveDate(date)}:${entityName}:${entityIsin}`

  const dividendInfosMap: Map<string, DividendInfo> = new Map()
  if (dividendSectionStartIndex !== -1){
    const isDividendRow = (row: string[]) => row[0] === 'Dividends' && row[1] === 'Data' && row[2] !== 'Total'
    for(let dividendRowIndex = dividendSectionStartIndex + 1; isDividendRow(fileContents[dividendRowIndex]); dividendRowIndex++){
      const row = fileContents[dividendRowIndex]
      const dividendCurrencyCode: CurrencyCode = row[2] as CurrencyCode
      const paymentDate: NaiveDate = toNaiveDate(row[3]) // TODO: decode to day string first?
      const parsedEntityName = row[4].match(/^([0-9A-Za-z]+)\(([0-9A-Za-z]+)\)/)!
      const payingEntity = parsedEntityName[1]
      const payingEntityIsin = parsedEntityName[2]
      const dividendCurrencyAmount = parseFloat(row[5])
      const dividendInfo: DividendInfo = {
        dividendCurrencyCode,
        paymentDate,
        payingEntity,
        dividendCurrencyAmount,
        whtCurrencyCode: dividendCurrencyCode, // Default value, may be overwritten
        whtCurrencyAmount: 0, // Default value, may be overwritten
      }
      const dividendInfoKey = toDividendKey(paymentDate, payingEntity, payingEntityIsin)
      if (dividendInfosMap.has(dividendInfoKey)){
        const existingDividendInfo = dividendInfosMap.get(dividendInfoKey)!
        if (existingDividendInfo.dividendCurrencyCode !== dividendInfo.dividendCurrencyCode){
          throw new Error('Duplicate dividends found with different currencies')
        }
        existingDividendInfo.dividendCurrencyAmount += dividendInfo.dividendCurrencyAmount
        if (existingDividendInfo.whtCurrencyCode !== dividendInfo.whtCurrencyCode){
          throw new Error('Duplicate dividends found with different withholding tax currencies')
        }
      } else {
        dividendInfosMap.set(dividendInfoKey, dividendInfo)
      }
    }

    const whtSectionStartIndex = fileContents.findIndex(x => 
      x[0] === 'Withholding Tax'
      && x[1] === 'Header'
      && x[2] === 'Currency'
      && x[3] === 'Date'
      && x[4] === 'Description'
      && x[5] === 'Amount'
      && x[6] === 'Code'
    )
    
    if (whtSectionStartIndex !== -1){
      const isWhtRow = (row: string[]) => row[0] === 'Withholding Tax' && row[1] === 'Data' && row[2] !== 'Total'
      for (let whtRowIndex = whtSectionStartIndex; isWhtRow(fileContents[whtRowIndex]); whtRowIndex++){
        const row = fileContents[whtRowIndex]
        const whtCurrencyCode: CurrencyCode = row[2] as CurrencyCode
        const paymentDate: NaiveDate = toNaiveDate(row[3])
        const parsedEntityName = row[4].match(/^([0-9A-Za-z]+)\(([0-9A-Za-z]+)\)/)!
        const payingEntity = parsedEntityName[1]
        const payingEntityIsin = parsedEntityName[2]
        const whtCurrencyAmount = -parseFloat(row[5])
        
        const dividendKey = toDividendKey(paymentDate, payingEntity, payingEntityIsin)
        const dividendInfo = dividendInfosMap.get(dividendKey)
        if (!dividendInfo){
          throw new Error('Cannot match WHT payment to dividend payment')
        } else if (dividendInfo.whtCurrencyAmount !== 0){
          throw new Error('Two WHT payments have been matched to the same dividend payment')
        } else {
          dividendInfo.whtCurrencyCode = whtCurrencyCode
          dividendInfo.whtCurrencyAmount = whtCurrencyAmount
        }
      }
    }
  }
  return [...dividendInfosMap.values()]
}

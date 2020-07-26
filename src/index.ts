import { Argv } from 'yargs'
import * as O from 'fp-ts/lib/Option'
import * as E from 'fp-ts/lib/Either'
import { getConf } from './conf'
import { DividendInfo, getDividendIncomeInfo } from './dividend'
import { trivialImporter } from './importers/trivial'
import { currencyService } from './currencies'
import { toNaiveDate } from './dates'
import { pipe } from 'fp-ts/lib/pipeable'
import { identity } from 'fp-ts/lib/function'
import { OpoData, getFilingDeadline, fillOpoForm } from './eporezi'
import { createHolidayService } from './holidays'
import fs from 'fs'
import path from 'path'
const yargs = require('yargs')

// DobKapProcessArgs is the data structure we receive from yargs
interface DobKapImportArgs {
  input: string
  importer?: string
  output?: string
  conf?: string
}

interface DobKapNormalizedImportArgs {
  inputFilePath: string
  importer: string
  outputDirPath: string
  confFilePath: O.Option<string>
}

const processImport = async (args: DobKapImportArgs) => {
  const normArgs: DobKapNormalizedImportArgs = {
    inputFilePath: args.input,
    importer: args.importer || 'trivial',
    outputDirPath: args.output || process.cwd(),
    confFilePath: O.fromNullable(args.conf),
  }
  const conf = pipe(
    getConf(normArgs.confFilePath),
    E.fold(e => {throw new Error(e.join('; '))}, identity)
  )
  
  let dividendInfo: DividendInfo
  if (normArgs.importer === 'trivial'){
    dividendInfo = await trivialImporter(normArgs.inputFilePath)
  } else {
    throw new Error('Unknown importer')
  }
  const dividendIncomeInfo = await getDividendIncomeInfo(currencyService, dividendInfo)
  
  const holidays = conf.holidays.map(h => toNaiveDate(h))
  const holidayRange = {start: toNaiveDate(conf.holidayRangeStart), end: toNaiveDate(conf.holidayRangeEnd)}
  const holidayService = createHolidayService(holidays, holidayRange)

  const filingDeadline = getFilingDeadline(holidayService, dividendIncomeInfo.paymentDate)

  const opoData: OpoData = {
    jmbg: conf.jmbg,
    fullName: conf.fullName,
    streetAddress: conf.streetAddress,
    filerJmbg: conf.jmbg,
    phoneNumber: conf.phoneNumber,
    opstinaCode: conf.opstinaCode,
    email: conf.email,
    realizationMethod: conf.realizationMethod,
    filingDeadline,
    dividendIncomeInfo,
  }
  const opoForm = fillOpoForm(opoData)
  const inputFileName = path.parse(normArgs.inputFilePath).name
  const outputFileName = inputFileName + '.out.xml'
  const outputFilePath = path.join(normArgs.outputDirPath, outputFileName)
  fs.writeFileSync(outputFilePath, opoForm.toString())
}

interface DobKapCheckRateArgs {
  day: string
  currency: string
}

const processCheckRate = async (args: DobKapCheckRateArgs) => {
  const rate = await currencyService(toNaiveDate(args.day), args.currency as any)
  console.log(rate)
}

yargs.scriptName('dobkap')
  .command('import', 'Import dividend files', (yargs: Argv) => {
    yargs.option('input', {
      describe: 'Path to input file',
      alias: 'i',
    })
    .option('importer', {
      describe: 'Importer',
      alias: 'm'
    })
    .option('output', {
      describe: 'Path to output file',
      alias: 'o'
    })
    .option('conf', {
      describe: 'Path to conf file',
      alias: 'c'
    })
    .demandOption(['input'])
  }, (args: any) => {
    processImport(args)
  })
  .command('checkrate', 'Check exchange rate', (yargs: Argv) => {
    yargs.option('day', {
      describe: 'Day in YYYY-MM-DD format',
      alias: 'd',
    })
    .option('currency', {
      describe: 'Currency code',
      alias: 'c'
    })
    .demandOption(['day', 'currency'])
  }, (args: any) => {
    processCheckRate(args)
  })
  .strict()
  .argv

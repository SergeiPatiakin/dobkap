import { Argv } from 'yargs'
import * as O from 'fp-ts/lib/Option'
import { getConf } from './conf'
import { DividendInfo, getDividendIncomeInfo } from './dividend'
import { trivialImporter } from './importers/trivial'
import { currencyService } from './currencies'
import { toNaiveDate } from './dates'
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
  const conf = getConf(normArgs.confFilePath)
  
  let dividendInfo: DividendInfo
  if (normArgs.importer === 'trivial'){
    dividendInfo = await trivialImporter(normArgs.inputFilePath)
  } else {
    throw new Error('Unknown importer')
  }
  const dividendIncomeInfo = getDividendIncomeInfo(currencyService, dividendInfo)
  console.log({dividendInfo, dividendIncomeInfo})
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
      describe: 'Path to output directory',
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

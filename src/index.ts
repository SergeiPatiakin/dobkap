import { Argv } from 'yargs'
import * as O from 'fp-ts/lib/Option'
import { getConf } from './conf'
const yargs = require('yargs')

// DobKapProcessArgs is the data structure we receive from yargs
interface DobKapProcessArgs {
  input: string
  importer?: string
  output?: string
  conf?: string
}

interface DobKapNormalizedArgs {
  inputFilePath: string
  importer: string
  outputDirPath: string
  confFilePath: O.Option<string>
}

const processCommand = (processArgs: DobKapProcessArgs) => {
  const normArgs: DobKapNormalizedArgs = {
    inputFilePath: processArgs.input,
    importer: processArgs.importer || 'ibkr',
    outputDirPath: processArgs.output || process.cwd(),
    confFilePath: O.fromNullable(processArgs.conf),
  }
  const conf = getConf(normArgs.confFilePath)
  console.log('hello', normArgs)
}

yargs.scriptName('dobkap')
  .command('process', 'Process dividend files', (yargs: Argv) => {
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
    processCommand(args)
  })
  .strict()
  .argv

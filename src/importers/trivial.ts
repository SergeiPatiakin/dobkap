/**
 * The trivial importer reads a DividendInfo directly from a JSON file
 */
import { promisify } from 'util'
import fs from 'fs'
import { DividendInfo } from '../dividend';
import { toNaiveDate } from '../dates';

const readFile = promisify(fs.readFile);

export const trivialImporter = async (inputFile: string): Promise<DividendInfo> => {
  const fileContents = await readFile(inputFile, 'utf8')
  const a = JSON.parse(fileContents)
  return {...a, paymentDate: toNaiveDate(a.paymentDate)}
}

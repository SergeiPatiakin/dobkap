/**
 * The trivial importer reads a DividendInfo directly from a JSON file
 */
import { DividendInfo } from '../dividend';
import { toNaiveDate } from '../dates';
import { readFile } from '../tools';

export const trivialImporter = async (inputFile: string): Promise<DividendInfo[]> => {
  const fileContents = await readFile(inputFile, 'utf8')
  const a = JSON.parse(fileContents)
  return [{...a, paymentDate: toNaiveDate(a.paymentDate)}]
}

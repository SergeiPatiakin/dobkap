import * as t from 'io-ts'
import * as O from 'fp-ts/lib/Option'
import * as E from 'fp-ts/lib/Either'
import { DayStringCodec, getValidationErrorMessages } from './data-types'
import { pipe, flow } from 'fp-ts/lib/function'
import fs from 'fs'

export const ConfCodec = t.type({
  jmbg: t.string,
  fullName: t.string, // TODO: cyrillic?
  streetAddress: t.string,
  phoneNumber: t.string, // TODO: regex validation?
  email: t.string,
  opstinaCode: t.string,
  realizationMethod: t.string,
  holidayRangeStart: DayStringCodec,
  holidayRangeEnd: DayStringCodec,
  holidays: t.array(DayStringCodec),
})
export type Conf = t.TypeOf<typeof ConfCodec>

export const getConf = (confFilePath: O.Option<string>): E.Either<string[], Conf> => {
  const tryPath = (path: string) => fs.existsSync(path) ? O.some(fs.readFileSync(path, {encoding: 'utf8'})): O.none
  return pipe(
    O.chain(tryPath)(confFilePath),
    O.alt(() => tryPath('dobkap.conf')),
    E.fromOption(() => ['Cannot find conf file']),
    E.chain(fileContents => E.parseJSON(fileContents, (e: any) => ['Failed to parse JSON', e.toString()])),
    E.chain(flow(ConfCodec.decode, E.mapLeft(getValidationErrorMessages)))
  )
}

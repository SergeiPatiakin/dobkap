import { Moment } from 'moment'
import * as t from 'io-ts'
import * as A from 'fp-ts/lib/Array'
import * as O from 'fp-ts/lib/Option'

export type Integer = number

export type NaiveDate = Moment

export const DayStringCodec = t.string
export type DayString = t.TypeOf<typeof DayStringCodec>

export const getValidationErrorMessages: (v: t.ValidationError[]) => string[] = A.filterMap(ve => O.fromNullable(ve.message))

import { Moment } from 'moment'
import * as t from 'io-ts'

export type Integer = number
export type UnsignedInteger = number

export type NaiveDate = Moment

export const DayStringCodec = t.string
export type DayString = t.TypeOf<typeof DayStringCodec>

export enum CurrencyCode {
  EUR = 'EUR',
  GBP = 'GBP',
  USD = 'USD',
  SGD = 'SGD',
  MXN = 'MXN',
}

import { DividendIncomeInfo } from "../dividend";
import { NaiveDate } from "../data-types";
import fs from "fs";
import path from 'path'
import libxml, { Element, Document } from 'libxmljs'

export interface OpoData {
  filingDeadline: NaiveDate
  jmbg: string
  fullName: string
  address: string
  opstinaCode: string
  filerJmbg: string
  phone: string
  email: string
  dividendIncomeInfo: DividendIncomeInfo
}

type XPathSafeString = string

const nsTag = (tagName: XPathSafeString) => `*["${tagName}"=local-name()]`

// Guaranteed to return the original object
const castToArray = <T>(a: T) => a as any as T[]

export const fillOpoForm = (data: OpoData): Document => {
  const opoTemplateContents = fs.readFileSync(path.join(__dirname, 'opo-template.xml'), {encoding: 'utf8'})
  const document = libxml.parseXmlString(opoTemplateContents)
  castToArray(
    document.get(`/${nsTag('PodaciPoreskeDeklaracije')}/${nsTag('PodaciOPrijavi')}/${nsTag('ObracunskiPeriod')}`)
  )[0]!.text(data.dividendIncomeInfo.paymentDate.format('YYYY-MM'))
  return document
}

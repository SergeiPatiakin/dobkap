import { DividendIncomeInfo } from "../dividend";
import { NaiveDate } from "../data-types";
import fs from "fs";
import path from 'path'
import libxml, { Element, Document } from 'libxmljs'

export interface OpoData {
  filingDeadline: NaiveDate
  jmbg: string
  fullName: string
  streetAddress: string
  opstinaCode: string
  filerJmbg: string
  phone: string
  email: string
  realizationMethod: string
  dividendIncomeInfo: DividendIncomeInfo
}

type XPathSafeString = string

// Convert local XPath tag-name selector to namespaced selector
const nsTag = (tagName: XPathSafeString) => `*["${tagName}"=local-name()]`

// Guaranteed to return the original object
const castToArray = <T>(a: T) => a as any as T[]

// Mutates the document
const setText = (document: Document, localXPath: string[], text: string): void => {
  const xPath = localXPath.map(x => `/${nsTag(x)}`).join('')
  castToArray(document.get(xPath)!)[0].text(text)
}

// Mutates the document
const setCdata = (document: Document, localXPath: string[], text: string): void => {
  const xPath = localXPath.map(x => `/${nsTag(x)}`).join('')
  ;(castToArray(document.get(xPath)!)[0] as any).cdata(text)
}

export const fillOpoForm = (data: OpoData): Document => {
  const opoTemplateContents = fs.readFileSync(path.join(__dirname, 'opo-template.xml'), {encoding: 'utf8'})
  const document = libxml.parseXmlString(opoTemplateContents)
  setText(document, ['PodaciPoreskeDeklaracije', 'PodaciOPrijavi', 'ObracunskiPeriod'], data.dividendIncomeInfo.paymentDate.format('YYYY-MM'))
  setText(document, ['PodaciPoreskeDeklaracije', 'PodaciOPrijavi', 'DatumOstvarivanjaPrihoda'], data.dividendIncomeInfo.paymentDate.format('YYYY-MM-DD'))
  // TODO: setText(document, ['PodaciPoreskeDeklaracije', 'PodaciOPrijavi', 'DatumDospelostiObaveze'], data.dividendIncomeInfo.paymentDate.format('YYYY-MM-DD'))
  
  setText(document, ['PodaciPoreskeDeklaracije', 'PodaciOPoreskomObvezniku', 'PoreskiIdentifikacioniBroj'], data.jmbg)
  setCdata(document, ['PodaciPoreskeDeklaracije', 'PodaciOPoreskomObvezniku', 'ImePrezimeObveznika'], data.fullName)
  setCdata(document, ['PodaciPoreskeDeklaracije', 'PodaciOPoreskomObvezniku', 'UlicaBrojPoreskogObveznika'], data.streetAddress)
  setText(document, ['PodaciPoreskeDeklaracije', 'PodaciOPoreskomObvezniku', 'PrebivalisteOpstina'], data.opstinaCode)
  setText(document, ['PodaciPoreskeDeklaracije', 'PodaciOPoreskomObvezniku', 'JMBGPodnosiocaPrijave'], data.filerJmbg)
  setText(document, ['PodaciPoreskeDeklaracije', 'PodaciOPoreskomObvezniku', 'TelefonKontaktOsobe'], data.phone)
  setText(document, ['PodaciPoreskeDeklaracije', 'PodaciOPoreskomObvezniku', 'ElektronskaPosta'], data.email)
  
  setText(document, ['PodaciPoreskeDeklaracije', 'PodaciONacinuOstvarivanjaPrihoda', 'Ostalo'], data.realizationMethod)
  // TODO: setText(document, ['PodaciPoreskeDeklaracije', 'DeklarisaniPodaciOVrstamaPrihoda', 'PodaciOVrstamaPrihoda', 'BrutoPrihod'], data.dividendIncomeInfo.grossDividend)

  return document
}

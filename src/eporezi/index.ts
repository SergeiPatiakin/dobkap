import { DividendIncomeInfo } from "../dividend";
import { NaiveDate } from "../data-types";
import fs from "fs";
import path from 'path'
import libxml, { Document } from 'libxmljs'
import { formatRsdAmount } from "../rsd-amount";
import { HolidayService } from "../holidays";

export interface OpoData {
  jmbg: string
  fullName: string
  streetAddress: string
  opstinaCode: string
  filerJmbg: string
  phoneNumber: string
  email: string
  realizationMethod: string
  filingDeadline: NaiveDate
  dividendIncomeInfo: DividendIncomeInfo
}

type XPathSafeString = string

// Convert local XPath tag-name selector to namespaced selector
const nsTag = (tagName: XPathSafeString) => `*["${tagName}"=local-name()]`

// Strange behavior with ts-node
const maybeHead = <T>(a: T | T[]): T => Array.isArray(a) ? (a as any)[0] : a as any

// Mutates the document
const setText = (document: Document, localXPath: string[], text: string): void => {
  const xPath = localXPath.map(x => `/${nsTag(x)}`).join('')
  maybeHead(document.get(xPath)!).text(text)
}

// Mutates the document
const setCdata = (document: Document, localXPath: string[], text: string): void => {
  const xPath = localXPath.map(x => `/${nsTag(x)}`).join('')
  maybeHead(document.get(xPath)! as any).cdata(text)
}

const TAX_FILING_DEADLINE_OFFSET = 30

export const getFilingDeadline = (holidayService: HolidayService, paymentDate: NaiveDate) => holidayService.workingDayAfter(paymentDate, TAX_FILING_DEADLINE_OFFSET)

export const fillOpoForm = (data: OpoData): Document => {
  const opoTemplateContents = fs.readFileSync(path.join(__dirname, 'opo-template.xml'), {encoding: 'utf8'})
  const document = libxml.parseXmlString(opoTemplateContents)
  setText(document, ['PodaciPoreskeDeklaracije', 'PodaciOPrijavi', 'ObracunskiPeriod'], data.dividendIncomeInfo.paymentDate.format('YYYY-MM'))
  setText(document, ['PodaciPoreskeDeklaracije', 'PodaciOPrijavi', 'DatumOstvarivanjaPrihoda'], data.dividendIncomeInfo.paymentDate.format('YYYY-MM-DD'))
  setText(document, ['PodaciPoreskeDeklaracije', 'PodaciOPrijavi', 'DatumDospelostiObaveze'], data.filingDeadline.format('YYYY-MM-DD'))
  
  setText(document, ['PodaciPoreskeDeklaracije', 'PodaciOPoreskomObvezniku', 'PoreskiIdentifikacioniBroj'], data.jmbg)
  setCdata(document, ['PodaciPoreskeDeklaracije', 'PodaciOPoreskomObvezniku', 'ImePrezimeObveznika'], data.fullName)
  setCdata(document, ['PodaciPoreskeDeklaracije', 'PodaciOPoreskomObvezniku', 'UlicaBrojPoreskogObveznika'], data.streetAddress)
  setText(document, ['PodaciPoreskeDeklaracije', 'PodaciOPoreskomObvezniku', 'PrebivalisteOpstina'], data.opstinaCode)
  setText(document, ['PodaciPoreskeDeklaracije', 'PodaciOPoreskomObvezniku', 'JMBGPodnosiocaPrijave'], data.filerJmbg)
  setText(document, ['PodaciPoreskeDeklaracije', 'PodaciOPoreskomObvezniku', 'TelefonKontaktOsobe'], data.phoneNumber)
  setText(document, ['PodaciPoreskeDeklaracije', 'PodaciOPoreskomObvezniku', 'ElektronskaPosta'], data.email)
  
  setText(document, ['PodaciPoreskeDeklaracije', 'PodaciONacinuOstvarivanjaPrihoda', 'Ostalo'], data.realizationMethod)

  setText(document, ['PodaciPoreskeDeklaracije', 'DeklarisaniPodaciOVrstamaPrihoda', 'PodaciOVrstamaPrihoda', 'BrutoPrihod'], formatRsdAmount(data.dividendIncomeInfo.grossDividend))
  setText(document, ['PodaciPoreskeDeklaracije', 'DeklarisaniPodaciOVrstamaPrihoda', 'PodaciOVrstamaPrihoda', 'OsnovicaZaPorez'], formatRsdAmount(data.dividendIncomeInfo.grossDividend))
  setText(document, ['PodaciPoreskeDeklaracije', 'DeklarisaniPodaciOVrstamaPrihoda', 'PodaciOVrstamaPrihoda', 'ObracunatiPorez'], formatRsdAmount(data.dividendIncomeInfo.grossTaxPayable))
  setText(document, ['PodaciPoreskeDeklaracije', 'DeklarisaniPodaciOVrstamaPrihoda', 'PodaciOVrstamaPrihoda', 'PorezPlacenDrugojDrzavi'], formatRsdAmount(data.dividendIncomeInfo.taxPaidAbroad))
  setText(document, ['PodaciPoreskeDeklaracije', 'DeklarisaniPodaciOVrstamaPrihoda', 'PodaciOVrstamaPrihoda', 'PorezZaUplatu'], formatRsdAmount(data.dividendIncomeInfo.taxPayable))
  // TODO: tax paid abroad needed in this section?

  setText(document, ['PodaciPoreskeDeklaracije', 'Ukupno', 'BrutoPrihod'], formatRsdAmount(data.dividendIncomeInfo.grossDividend))
  setText(document, ['PodaciPoreskeDeklaracije', 'Ukupno', 'OsnovicaZaPorez'], formatRsdAmount(data.dividendIncomeInfo.grossDividend))
  setText(document, ['PodaciPoreskeDeklaracije', 'Ukupno', 'ObracunatiPorez'], formatRsdAmount(data.dividendIncomeInfo.grossTaxPayable))
  setText(document, ['PodaciPoreskeDeklaracije', 'Ukupno', 'PorezPlacenDrugojDrzavi'], formatRsdAmount(data.dividendIncomeInfo.taxPaidAbroad))
  setText(document, ['PodaciPoreskeDeklaracije', 'Ukupno', 'PorezZaUplatu'], formatRsdAmount(data.dividendIncomeInfo.taxPayable))

  return document
}

import { DividendIncomeInfo } from "../dividend";
import { NaiveDate } from "../data-types";
import fs from "fs";
import path from 'path'
import { formatRsdAmount } from "../rsd-amount";
import { HolidayService } from "../holidays";
import { XMLParser, XMLBuilder } from "fast-xml-parser"

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

const TAX_FILING_DEADLINE_OFFSET = 30

export const getFilingDeadline = (holidayService: HolidayService, paymentDate: NaiveDate) => holidayService.workingDayAfter(paymentDate, TAX_FILING_DEADLINE_OFFSET)

export const fillOpoForm = (data: OpoData): string => {
  const opoTemplateContents = fs.readFileSync(path.join(__dirname, 'opo-template.xml'), {encoding: 'utf8'})

  const parser = new XMLParser({ ignoreAttributes: false, /* preserveOrder: true */ parseTagValue: false })
  const document = parser.parse(opoTemplateContents)
  document['ns1:PodaciPoreskeDeklaracije']['ns1:PodaciOPrijavi']['ns1:ObracunskiPeriod'] = data.dividendIncomeInfo.paymentDate.format('YYYY-MM')
  document['ns1:PodaciPoreskeDeklaracije']['ns1:PodaciOPrijavi']['ns1:DatumOstvarivanjaPrihoda'] = data.dividendIncomeInfo.paymentDate.format('YYYY-MM-DD')
  document['ns1:PodaciPoreskeDeklaracije']['ns1:PodaciOPrijavi']['ns1:DatumDospelostiObaveze'] = data.filingDeadline.format('YYYY-MM-DD')

  document['ns1:PodaciPoreskeDeklaracije']['ns1:PodaciOPoreskomObvezniku']['ns1:PoreskiIdentifikacioniBroj'] = data.jmbg
  document['ns1:PodaciPoreskeDeklaracije']['ns1:PodaciOPoreskomObvezniku']['ns1:ImePrezimeObveznika'] = { cdataContent: data.fullName }
  document['ns1:PodaciPoreskeDeklaracije']['ns1:PodaciOPoreskomObvezniku']['ns1:UlicaBrojPoreskogObveznika'] = { cdataContent: data.streetAddress }
  document['ns1:PodaciPoreskeDeklaracije']['ns1:PodaciOPoreskomObvezniku']['ns1:PrebivalisteOpstina'] = data.opstinaCode
  document['ns1:PodaciPoreskeDeklaracije']['ns1:PodaciOPoreskomObvezniku']['ns1:JMBGPodnosiocaPrijave'] = data.filerJmbg
  document['ns1:PodaciPoreskeDeklaracije']['ns1:PodaciOPoreskomObvezniku']['ns1:TelefonKontaktOsobe'] = data.phoneNumber
  document['ns1:PodaciPoreskeDeklaracije']['ns1:PodaciOPoreskomObvezniku']['ns1:ElektronskaPosta'] = data.email
  
  document['ns1:PodaciPoreskeDeklaracije']['ns1:PodaciONacinuOstvarivanjaPrihoda']['ns1:Ostalo'] = data.realizationMethod
  
  document['ns1:PodaciPoreskeDeklaracije']['ns1:DeklarisaniPodaciOVrstamaPrihoda']['ns1:PodaciOVrstamaPrihoda']['ns1:BrutoPrihod'] = formatRsdAmount(data.dividendIncomeInfo.grossDividend)
  document['ns1:PodaciPoreskeDeklaracije']['ns1:DeklarisaniPodaciOVrstamaPrihoda']['ns1:PodaciOVrstamaPrihoda']['ns1:OsnovicaZaPorez'] = formatRsdAmount(data.dividendIncomeInfo.grossDividend)
  document['ns1:PodaciPoreskeDeklaracije']['ns1:DeklarisaniPodaciOVrstamaPrihoda']['ns1:PodaciOVrstamaPrihoda']['ns1:ObracunatiPorez'] = formatRsdAmount(data.dividendIncomeInfo.grossTaxPayable)
  document['ns1:PodaciPoreskeDeklaracije']['ns1:DeklarisaniPodaciOVrstamaPrihoda']['ns1:PodaciOVrstamaPrihoda']['ns1:PorezPlacenDrugojDrzavi'] = formatRsdAmount(data.dividendIncomeInfo.taxPaidAbroad)
  document['ns1:PodaciPoreskeDeklaracije']['ns1:DeklarisaniPodaciOVrstamaPrihoda']['ns1:PodaciOVrstamaPrihoda']['ns1:PorezZaUplatu'] = formatRsdAmount(data.dividendIncomeInfo.taxPayable)
  
  document['ns1:PodaciPoreskeDeklaracije']['ns1:Ukupno']['ns1:BrutoPrihod'] = formatRsdAmount(data.dividendIncomeInfo.grossDividend)
  document['ns1:PodaciPoreskeDeklaracije']['ns1:Ukupno']['ns1:OsnovicaZaPorez'] = formatRsdAmount(data.dividendIncomeInfo.grossDividend)
  document['ns1:PodaciPoreskeDeklaracije']['ns1:Ukupno']['ns1:ObracunatiPorez'] = formatRsdAmount(data.dividendIncomeInfo.grossTaxPayable)
  document['ns1:PodaciPoreskeDeklaracije']['ns1:Ukupno']['ns1:PorezPlacenDrugojDrzavi'] = formatRsdAmount(data.dividendIncomeInfo.taxPaidAbroad)
  document['ns1:PodaciPoreskeDeklaracije']['ns1:Ukupno']['ns1:PorezZaUplatu'] = formatRsdAmount(data.dividendIncomeInfo.taxPayable)

  const builder = new XMLBuilder({ format: true, ignoreAttributes: false, /* preserveOrder: true */ cdataPropName: 'cdataContent' })
  const opoFormContents = `<?xml version="1.0" encoding="UTF-8"?>\n` + builder.build(document)

  return opoFormContents
}

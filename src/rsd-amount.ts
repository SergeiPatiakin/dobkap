export type RsdAmount = {
  cents: bigint
}

export const map = (f: (x: bigint) => bigint) => (a: RsdAmount): RsdAmount => ({
  cents: f(a.cents),
})

export const map2 = (f: (x: bigint, y: bigint) => bigint) => (a: RsdAmount, b: RsdAmount): RsdAmount => ({
  cents: f(a.cents, b.cents)
})

export const fromCurrency = (exchangeRate: number, currencyAmount: number) => {
  const cents = 100 * exchangeRate * currencyAmount
  return {cents: BigInt(cents)}
}

export const multiply = (factor: number) => (amount: RsdAmount) => ({
  cents: BigInt(Math.round(Number(amount.cents) * factor))
})

export const subtract = map2((x: bigint, y: bigint): bigint => x - y)

export const zero = ({
  cents: BigInt(0),
})

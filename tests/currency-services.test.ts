import { nbsCurrencyService } from '../src/currency-services/nbs'

describe('nbs currency services', () => {
  it('smoke test', async () => {
    await nbsCurrencyService()
  })
})

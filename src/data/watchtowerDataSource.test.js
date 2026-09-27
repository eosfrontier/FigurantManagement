import { describe, expect, it, vi } from 'vitest'
import {
  createWatchtowerDataSource,
  normalizeInGameDate,
} from './watchtowerDataSource.js'

describe('Watchtower data source', () => {
  it('normalizes the date fields used by age calculation', async () => {
    const client = {
      getCurrentTime: vi.fn().mockResolvedValue({
        iYear: 240,
        iMonth: 12,
        iDay: 27,
        iYearBefore: '',
        iYearAfter: 'NT',
      }),
    }
    const source = createWatchtowerDataSource(client)

    await expect(source.getCurrentInGameDate()).resolves.toEqual({
      year: 240,
      month: 12,
      day: 27,
      yearPrefix: '',
      yearSuffix: 'NT',
    })
  })

  it('rejects an impossible in-game date', () => {
    expect(() =>
      normalizeInGameDate({ iYear: 240, iMonth: 2, iDay: 31 }),
    ).toThrow('invalid day')
  })
})

import { describe, expect, it } from 'vitest'
import { factionData, factionOrder } from './factionData.js'
import {
  generateFactionName,
  generateFactionNames,
  replaceDugoSurname,
} from './nameGenerator.js'

describe('name generation', () => {
  it('combines configured fields using the configured separator', () => {
    const data = {
      desiredOutput: ['first', 'last'],
      chanceOfOutput: [1, 1],
      concatinationSymbol: ['-'],
      first: ['Ada'],
      last: ['Vale'],
    }

    expect(generateFactionName(data, () => 0.5)).toBe('Ada-Vale')
  })

  it('generates the configured number of non-empty candidates for every faction', () => {
    for (const factionId of factionOrder) {
      const names = generateFactionNames(factionData[factionId], 6, () => 0.5)
      expect(names).toHaveLength(6)
      expect(names.every(Boolean)).toBe(true)
    }
  })

  it('replaces the second Dugo name component with an Asul surname', () => {
    expect(replaceDugoSurname('Mara Venn Tor', ['Asul'], () => 0)).toBe(
      'Mara Asul Tor',
    )
  })
})
